import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import assert, { is_string } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    params = Object.assign({
        "from_mobile": false,
        "is_public": true,
    }, params)

    const { text, ip_address, from_mobile, is_public } = params

    if (is_string(text) === false) {
        throw new Error("本文を入力してください")
    }
    if (text.length == 0) {
        throw new Error("本文を入力してください")
    }
    if (text.length > config.status.max_text_length) {
        throw new Error(`本文は${config.status.max_text_length}文字以内で入力してください`)
    }

    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    if (is_string(ip_address) === false) {
        throw new Error("@ip_addressが不正です")
    }

    if (typeof from_mobile !== "boolean") {
        throw new Error("@from_mobileが不正ですb")
    }
    config.status.forbidden_words.forEach(word => {
        if (text.indexOf(word) !== -1) {
            throw new Error("禁止ワードが含まれています")
        }
    })

    const query = {
        text,
        user_id,
        from_mobile,
        is_public,
        "likes_count": 0,
        "favorites_count": 0,
        "comments_count": 0,
        "created_at": Date.now(),
        "do_not_notify": false,
        "_ip_address": ip_address
    }

    const { channel_id, recipient_id, community_id, in_reply_to_status_id } = params
    if (channel_id) {
        query.channel_id = try_convert_to_object_id(channel_id, "$channel_idが不正です")
    }
    if (recipient_id) {
        query.recipient_id = try_convert_to_object_id(recipient_id, "$recipient_idが不正です")
    }
    if (community_id) {
        query.community_id = try_convert_to_object_id(community_id, "$community_idが不正です")
    }
    if (in_reply_to_status_id) {
        query.in_reply_to_status_id = try_convert_to_object_id(in_reply_to_status_id, "$in_reply_to_status_idが不正です")
    }

    if (typeof params.entities === "object" && Object.keys(params.entities).length > 0) {
        const json_str = JSON.stringify(params.entities)
        assert(json_str.length > 0, "$entitiesが不正です")
        assert(json_str.length < 10000, "$entitiesが大きすぎます")
        query.entities = JSON.parse(json_str)
    }

    if (params.do_not_notify === true) {
        query.do_not_notify = true
    }

    const collection = db.collection("statuses")

    // 最初の投稿は本人以外にできないようにする
    // if (recipient_id) {
    //     const status = await collection.findOne({ recipient_id })
    //     if (status === null) {
    //         if (user_id.equals(recipient_id) === false) {
    //             throw new Error("最初の投稿は本人以外にはできません")
    //         }
    //     }
    // }

    const result = await collection.insertOne(query)
    const status = result.ops[0]
    status.id = status._id
    for (const key in status) {
        if (key.indexOf("_") == 0) {
            delete status[key]
        }
    }
    return status
}