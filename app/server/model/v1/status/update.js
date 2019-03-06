import axios from "axios"
import jschardet from "jschardet"
import { Iconv } from "iconv"
import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"
import assert, { is_string } from "../../../assert"
import { mentions_type } from "../../../enums"
import { try_convert_to_object_id } from "../../../lib/object_id"

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

const before_update = async (db, params) => {
    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    // 連投規制
    if (user.id in prev_updated_at) {
        const updated_at = prev_updated_at[user.id]
        if (Date.now() - updated_at <= config.status.minimum_interval) {
            throw new Error("投稿間隔が短すぎます")
        }
    }

    return { user }
}

const after_update = user => {
    // 連投規制
    prev_updated_at[user.id] = Date.now()
}

const parse_mentions = async (db, text) => {
    const mentions = []
    {
        const regexp = new RegExp(`@(${config.user.name_regexp})`, "g")
        let match = regexp.exec(text)
        const recipient_name_set = new Set()
        while (match !== null) {
            const user_name = match[1]
            recipient_name_set.add(user_name)
            match = regexp.exec(text)
        }
        recipient_name_set.forEach(async name => {
            const user = await memcached.v1.user.show(db, { name })
            if (user === null) {
                return
            }
            await api.v1.notifications.add(db, {
                "user_id": user.id,
                "status_id": status.id,
                "community_id": community ? community.id : null,
                "type": mentions_type.reply
            })
            mentions.push(user)
            memcached.v1.timeline.notifications.flush(user.id)
        })
    }
    return mentions
}

const parse_entities = async text => {
    const entities = {}
    const urls = text.match(/!https?:\/\/[^\s 　]+/g)
    if (urls === null) {
        return entities
    }
    if (urls.length > 0) {
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
    return entities
}

const update = async (db, params) => {
    return await api.v1.status.update(db, params)
}

export const update_channel = async (db, params) => {
    const { user } = await before_update(db, params)

    const channel_id = try_convert_to_object_id(params.channel_id, "channel_idを指定してください")
    const channel = await memcached.v1.channel.show(db, { "id": channel_id })
    assert(channel !== null, "チャンネルが見つかりません")

    const joined = await memcached.v1.channel.joined(db, { "channel_id": channel.id, "user_id": user.id })
    assert(joined === true, "参加していないチャンネルには投稿できません")

    const community = await memcached.v1.community.show(db, { "id": channel.community_id })
    assert(community !== null, "コミュニティが見つかりません")

    params.community_id = community.id
    params.is_public = !!channel.is_public
    params.entities = await parse_entities(params.text)

    const status = await update(db, params)
    const mentions = await parse_mentions(db, status.text)

    // タイムラインに追加
    await api.v1.timeline.channel.push(db, {
        "status_id": status.id,
        "user_id": user.id,
        "channel_id": channel.id,
    })

    // パブリックタイムラインに追加
    if (channel.is_public) {
        await api.v1.timeline.community.push(db, {
            "status_id": status.id,
            "user_id": user.id,
            "community_id": community.id,
        })
    }

    // チャンネルを更新
    await db.collection("channels").updateOne(
        { "_id": channel.id },
        {
            "$inc": { "statuses_count": 1 },
            "$set": { "newest_status_id": status.id }
        }
    )

    memcached.v1.statuses.channel.count.flush(channel.id)
    memcached.v1.statuses.community.count.flush(community.id)
    memcached.v1.timeline.channel.flush(channel.id)
    memcached.v1.timeline.community.flush(community.id)

    after_update(user)

    return {
        "status_id": status.id,
        "mentions": mentions
    }
}

export const update_thread = async (db, params) => {
    const { user } = await before_update(db, params)

    const in_reply_to_status_id = try_convert_to_object_id(params.in_reply_to_status_id, "in_reply_to_status_idを指定してください")
    const in_reply_to_status = await memcached.v1.status.show(db, { "id": in_reply_to_status_id })
    assert(in_reply_to_status !== null, "コメント先の投稿が見つかりません")

    const in_reply_to_status_user = await memcached.v1.user.show(db, { "id": in_reply_to_status.user_id })
    assert(in_reply_to_status_user !== null, "コメント先の投稿のユーザーが存在しないためコメントできません")

    const { channel_id } = in_reply_to_status
    if (channel_id) {
        const channel = await memcached.v1.channel.show(db, { "id": channel_id })
        assert(channel !== null, "コメント先の投稿が属しているチャンネルが見つかりません")
        params.channel_id = channel_id

        const joined = await memcached.v1.channel.joined(db, { "channel_id": channel.id, "user_id": user.id })
        assert(joined === true, "参加していないチャンネルの投稿にはコメントできません")

        const community = await memcached.v1.community.show(db, { "id": channel.community_id })
        assert(community !== null, "コメント先の投稿が属しているコミュニティが見つかりません")
        params.community_id = community.id
    }

    params.is_public = false
    params.entities = await parse_entities(params.text)

    const status = await update(db, params)
    const mentions = await parse_mentions(db, status.text)

    // タイムラインに追加
    await api.v1.timeline.thread.push(db, {
        "status_id": status.id,
        "user_id": user.id,
        "in_reply_to_status_id": in_reply_to_status.id,
    })
    if (params.community_id) {
        await api.v1.timeline.community.push(db, {
            "status_id": status.id,
            "user_id": user.id,
            "community_id": params.community_id,
        })
    }

    // スレッド
    if (in_reply_to_status.comments_count === 0) {
        // コメント先の投稿も追加しておくとタイムラインの取得が楽になる
        try {
            await api.v1.timeline.thread.push(db, {
                "status_id": in_reply_to_status.id,
                "user_id": in_reply_to_status.user_id,
                "in_reply_to_status_id": in_reply_to_status.id,
            })
        } catch (error) {

        }
    }

    // 通知
    await api.v1.notifications.add(db, {
        "user_id": in_reply_to_status_user.id,
        "status_id": status.id,
        "community_id": params.community_id,
        "type": mentions_type.comment
    })
    memcached.v1.timeline.notifications.flush(in_reply_to_status_user.id)
    mentions.push(in_reply_to_status_user)

    const comments_count = await db.collection("statuses").find({
        "in_reply_to_status_id": in_reply_to_status.id
    }).count()
    const user_ids = await db.collection("thread_timeline").aggregate([
        {
            "$match": {
                "belongs_to": in_reply_to_status.id,
                "status_id": { "$ne": in_reply_to_status.id }
            }
        },
        { "$group": { "_id": "$user_id" } },
        { "$sort": { "status_id": -1 } }
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

    memcached.v1.statuses.thread.count.flush(in_reply_to_status.id)
    memcached.v1.status.show.flush(in_reply_to_status.id)
    memcached.v1.timeline.thread.flush(in_reply_to_status.id)
    if (params.community_id) {
        memcached.v1.timeline.community.flush(params.community_id)
        memcached.v1.statuses.community.count.flush(params.community_id)
    }

    after_update(user)

    return {
        "status_id": status.id,
        "mentions": mentions
    }
}

export const update_message = async (db, params) => {
    const { user } = await before_update(db, params)

    const recipient = await memcached.v1.user.show(db, { "id": params.recipient_id })
    assert(recipient !== null, "宛先のユーザーが見つかりません")

    params.entities = await parse_entities(params.text)

    const status = await update(db, params)
    const mentions = await parse_mentions(db, status.text)

    // タイムラインに追加
    await api.v1.timeline.message.push(db, {
        "status_id": status.id,
        "user_id": user.id,
        "recipient_id": recipient.id,
    })

    memcached.v1.statuses.message.count.flush(recipient.id)
    memcached.v1.timeline.message.flush(recipient.id)

    after_update(user)

    return {
        "status_id": status.id,
        "mentions": mentions
    }
}