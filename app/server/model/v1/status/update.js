import axios from "axios"
import jschardet from "jschardet"
import { Iconv } from "iconv"
import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"
import assert, { is_string } from "../../../assert"
import { mentions_type } from "../../../enums"

// 連投規制用
const prev_updated_at = {}

const request = axios.create({
    "responseType": "arraybuffer",
    "timeout": config.status.embedding.web.timeout * 1000,
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
            throw new Error()
        }
        head = head[0]
        const metatags = head.match(/<meta[^>]+>/g)
        const map_property_content = {}
        const map_name_content = {}
        let charset = "utf-8"
        metatags.forEach(tag => {
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
        })

        if ("title" in map_name_content) {
            title = map_name_content["title"]
        }
        if ("description" in map_name_content) {
            description = map_name_content["description"]
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
        }
        if (description && description.length > config.status.embedding.web.max_description_length) {
            description = description.substring(0, config.status.embedding.web.max_description_length + 1)
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

    params.is_public = true

    // 連投規制
    if (user.id in prev_updated_at) {
        const updated_at = prev_updated_at[user.id]
        if (Date.now() - updated_at <= config.status.minimum_interval) {
            throw new Error("投稿間隔が短すぎます")
        }
    }

    let channel = null
    if (params.channel_id) {
        channel = await memcached.v1.channel.show(db, { "id": params.channel_id })
        assert(channel !== null, "チャンネルがが見つかりません")

        const joined = await memcached.v1.channel.joined(db, { "channel_id": channel.id, "user_id": user.id })
        assert(joined === true, "参加していないチャンネルには投稿できません")

        params.server_id = channel.server_id
        params.is_public = !!channel.is_public
    }

    let recipient = null
    if (params.recipient_id) {
        recipient = await memcached.v1.user.show(db, { "id": params.recipient_id })
        assert(recipient !== null, "宛先のユーザーが見つかりません")
    }

    let in_reply_to_status = null
    if (params.in_reply_to_status_id) {
        in_reply_to_status = await memcached.v1.status.show(db, { "id": params.in_reply_to_status_id })
        assert(in_reply_to_status !== null, "コメント先の投稿が見つかりません")
        params.is_public = false
    }

    let server = null
    if (params.server_id) {
        server = await memcached.v1.server.show(db, { "id": params.server_id })
    } else if (channel) {
        server = await memcached.v1.server.show(db, { "id": channel.server_id })
        assert(server !== null, "サーバーが見つかりません")
        params.server_id = server.id
    } else if (in_reply_to_status) {
        server = await memcached.v1.server.show(db, { "id": in_reply_to_status.server_id })
        assert(server !== null, "サーバーが見つかりません")
        params.server_id = server.id
    }
    assert(server !== null, "問題が発生しました")

    let joined_server = await memcached.v1.server.joined(db, { "user_id": params.user_id, "server_id": server.id })
    assert(joined_server === true, "参加していないサーバーのチャンネルには投稿できません")

    assert(is_string(params.text), "本文を入力してください")
    const urls = params.text.match(/!https?:\/\/[^\s 　]+/g)

    const entities = {}
    if (Array.isArray(urls)) {
        const entity_urls = []
        for (let n = 0; n < Math.min(urls.length, config.status.embedding.web.limit); n++) {
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
        if (user !== null) {
            await api.v1.notifications.add(db, {
                "user_id": user.id,
                "status_id": status.id,
                "server_id": server.id,
                "type": mentions_type.reply
            })
            mentions.push(user)
            memcached.v1.timeline.notifications.flush(user.id)
        }
        match = regexp.exec(params.text)
    }

    if (channel) {
        const result = await db.collection("channels").updateOne(
            { "_id": channel.id },
            {
                "$inc": { "statuses_count": 1 },
                "$set": { "newest_status_id": status.id }
            }
        )
        memcached.v1.timeline.channel.flush(channel.id)
    }

    if (recipient) {
        memcached.v1.timeline.home.flush(recipient.id, server.id)
    }

    if (server) {
        memcached.v1.timeline.server.flush(server.id)
    }

    if (in_reply_to_status) {
        // スレッド
        if (!!in_reply_to_status.comments_count == false || in_reply_to_status.comments_count === 0) {
            // 自分自身も追加しておくとタイムラインの取得が楽になる
            await db.collection("threads").insertOne({
                "status_id": in_reply_to_status.id,
                "in_reply_to_status_id": in_reply_to_status.id,
            })
        }
        await db.collection("threads").insertOne({
            "status_id": status.id,
            "in_reply_to_status_id": in_reply_to_status.id,
            "user_id": user.id
        })
        memcached.v1.timeline.thread.flush(in_reply_to_status.id)

        // 通知
        const in_reply_to_user = await memcached.v1.user.show(db, { "id": in_reply_to_status.user_id })
        if (in_reply_to_user !== null) {
            await api.v1.notifications.add(db, {
                "user_id": in_reply_to_user.id,
                "status_id": status.id,
                "server_id": server.id,
                "type": mentions_type.comment
            })
            mentions.push(in_reply_to_user)
            memcached.v1.timeline.notifications.flush(in_reply_to_user.id)
        }

        const comments_count = await db.collection("statuses").find({
            "in_reply_to_status_id": in_reply_to_status.id
        }).count()
        const user_ids = await db.collection("threads").aggregate([
            { $match: { "in_reply_to_status_id": in_reply_to_status.id } },
            { $group: { _id: "$user_id" } }
        ]).toArray()

        const commenter_ids = []
        user_ids.forEach(user => {
            const user_id = user._id
            if (user_id) {
                commenter_ids.push(user_id)
            }
        })

        // 最新のコメントの投稿IDを追加しておくと、宛先の投稿でコメントをプレビューすることができる
        const last_comment_status_id = status.id

        await db.collection("statuses").updateOne({ "_id": in_reply_to_status.id }, {
            "$set": { comments_count, commenter_ids, last_comment_status_id }
        })

        memcached.v1.status.show.flush(in_reply_to_status.id)
    }

    // 連投規制
    prev_updated_at[user.id] = Date.now()

    return {
        "status_id": status.id,
        "mentions": mentions
    }
}