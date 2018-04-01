import axios from "axios"
import jschardet from "jschardet"
import { Iconv } from "iconv"
import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"
import assert, { is_string } from "../../../assert";

// 連投規制用
const prev_updated_at = {}

const request = axios.create({
    "responseType": "arraybuffer",
    "timeout": config.status.embed.web.timeout * 1000,
})

const get_domain_from_url = url => {
    const component = url.split("/")
    if (component.length < 2) {
        return null
    }
    let domain = component[2]
    if (domain.indexOf(".") === -1) {
        return null
    }
    return domain
}

const get_protocol_from_url = url => {
    const component = url.split("://")
    if (component.length < 2) {
        return null
    }
    return component[0]
}

const extract_metadata = async url => {
    let image = null
    let title = null
    let description = null
    let match = null
    const domain = get_domain_from_url(url)
    const protocol = get_protocol_from_url(url)

    // 実際にURLを読み込んでタイトルなどを取得
    try {
        const responce = await request.get(url, {
            "transformResponse": [data => {
                const result = jschardet.detect(data)
                const { encoding, confidence } = result
                if (confidence < 0.8) {
                    return data.toString()
                }
                const iconv = new Iconv(encoding, "UTF-8")
                return iconv.convert(data).toString()
            }]
        })
        const html = responce.data.replace(/[\n\t\r]/g, "")
        let head = html.match(/<head([^>]+)?>.+?<\/head>/g)
        if (head.length !== 1) {
            throw Error()
        }
        head = head[0]
        const metatags = head.match(/<meta[^>]+>/g)
        const map_property_content = {}
        const map_name_content = {}
        let charset = "utf-8"
        for (const tag of metatags) {
            match = tag.match(/property=['"](.+?)['"]/)
            if (match) {
                const property = match[1]
                match = tag.match(/content=['"](.+?)['"]/)
                if (match) {
                    const content = match[1]
                    map_property_content[property] = content
                }
            }
            match = tag.match(/name=['"](.+?)['"]/)
            if (match) {
                const name = match[1]
                match = tag.match(/content=['"](.+?)['"]/)
                if (match) {
                    const content = match[1]
                    map_name_content[name] = content
                }
            }
            match = tag.match(/charset=['"](.+?)['"]/)
            if (match) {
                charset = match[1]
            }
        }

        if (head.indexOf("og:") !== -1) {
            if ("og:title" in map_property_content) {
                title = map_property_content["og:title"]
            }
            if ("og:description" in map_property_content) {
                description = map_property_content["og:description"]
            }
            if ("og:image" in map_property_content) {
                image = map_property_content["og:image"]
                if (image.indexOf("/") === 0) {
                    image = `${protocol}://${domain}${image}`
                }
            }
        } else {
            match = head.match(/<title>(.+?)<\/title>/)
            if (match) {
                title = match[1]
            }
            if ("description" in map_name_content) {
                description = map_name_content["description"]
            }
        }
        if (description && description.length > config.status.embed.web.max_description_length) {
            description = description.substring(0, config.status.embed.web.max_description_length + 1)
        }
    } catch (error) {
        image = null
        title = null
        description = null
        match = null
    }
    return { domain, image, title, description, url }
}

export default async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    // 連投規制
    if (user.id in prev_updated_at) {
        const updated_at = prev_updated_at[user.id]
        if (Date.now() - updated_at <= config.status.minimum_interval) {
            throw new Error("投稿間隔が短すぎます")
        }
    }

    let hashtag = null
    if (params.hashtag_id) {
        hashtag = await memcached.v1.hashtag.show(db, { "id": params.hashtag_id })
        assert(hashtag !== null, "ルームがが見つかりません")
        params.server_id = hashtag.server_id
        params.is_public = !!hashtag.is_public
    }

    let recipient = null
    if (params.recipient_id) {
        recipient = await memcached.v1.user.show(db, { "id": params.recipient_id })
        assert(recipient !== null, "宛先のユーザーが見つかりません")
    }

    let server = null
    if (params.server_id) {
        server = await memcached.v1.server.show(db, { "id": params.server_id })
        assert(server !== null, "サーバーが見つかりません")
    } else if (hashtag) {
        server = await memcached.v1.server.show(db, { "id": hashtag.server_id })
        assert(server !== null, "サーバーが見つかりません")
    }
    if (recipient) {
        assert(server !== null, "ホームへ投稿する場合はサーバーを指定してください")
    }
    assert(server !== null, "@server must be of type object")

    assert(is_string(params.text), "本文を入力してください")
    const urls = params.text.match(/!https?:\/\/[^\s 　]+/g)

    const entities = {}
    if (Array.isArray(urls)) {
        const entity_urls = []
        for (let n = 0; n < Math.min(urls.length, config.status.embed.web.limit); n++) {
            const original_url = urls[n].replace(/^!/, "")
            const { domain, image, title, description, url } = await extract_metadata(original_url)
            if (title && url) {
                entity_urls.push({ domain, image, title, description, url, original_url })
            }
        }
        if (entity_urls.length > 0) {
            entities.urls = entity_urls
        }
    }
    params.entities = entities

    const status = await api.v1.status.update(db, params)

    const regexp = new RegExp(`@(${config.user.name_regexp})`, "g")
    const mentions = []
    let match = regexp.exec(params.text)
    while (match !== null) {
        const user_name = match[1]
        const user = await memcached.v1.user.show(db, { "name": user_name })
        await api.v1.mentions.add(db, {
            "recipient_id": user.id,
            "status_id": status.id,
            "server_id": server.id
        })
        mentions.push(user)
        memcached.v1.delete_timeline_mentions_from_cache(user)
        match = regexp.exec(params.text);
    }

    if (hashtag) {
        memcached.v1.delete_timeline_hashtag_from_cache(hashtag)
        const collection = db.collection("hashtags")
        const result = await collection.updateOne(
            { "_id": hashtag.id },
            { "$inc": { "statuses_count": 1 } }
        )
        hashtag.statuses_count += 1		// キャッシュを直接変更
    }

    if (recipient) {
        memcached.v1.delete_timeline_home_from_cache(recipient, server)
    }

    if (server) {
        memcached.v1.delete_timeline_server_from_cache(server)
    }

    // 連投規制
    prev_updated_at[user.id] = Date.now()

    return {
        "status_id": status.id,
        mentions
    }
}