import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import { is_string } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

const verify_destination = params => {
    let { hashtag_id, recipient_id, server_id } = params

    if (hashtag_id) {
        hashtag_id = try_convert_to_object_id(hashtag_id, "@hashtag_idが不正です")
    }
    if (recipient_id) {
        recipient_id = try_convert_to_object_id(recipient_id, "@recipient_idが不正です")
    }
    if (server_id) {
        server_id = try_convert_to_object_id(server_id, "@server_idが不正です")
    }

    if (!!server_id === false) {
        throw new Error("@server_idを指定してください")
    }

    if (recipient_id && hashtag_id) {
        throw new Error("投稿先が重複しています（@recipient_id && @hashtag_id）")
    }
    if (!!recipient_id === false && !!hashtag_id === false) {
        throw new Error("投稿先を指定してください")
    }

    return { hashtag_id, recipient_id, server_id }
}

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

    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")

    if (is_string(ip_address) === false) {
        throw new Error("@ip_addressが不正です")
    }

    if (typeof from_mobile !== "boolean") {
        throw new Error("@from_mobileが不正ですb")
    }

    if (typeof is_public !== "boolean") {
        throw new Error("@is_publicが不正です")
    }

    for (const word of config.status.forbidden_words) {
        if (text.indexOf(word) !== -1) {
            throw new Error("禁止ワードが含まれています")
        }
    }

    const query = {
        text,
        user_id,
        from_mobile,
        is_public,
        "likes_count": 0,
        "favorites_count": 0,
        "created_at": Date.now(),
        "do_not_notify": false,
        "_ip_address": ip_address
    }

    const { hashtag_id, recipient_id, server_id } = verify_destination(params)

    // ルームへの投稿
    if (hashtag_id) {
        query.hashtag_id = hashtag_id
    }
    // ユーザーのホームへの投稿
    if (recipient_id) {
        query.recipient_id = recipient_id
    }
    // サーバーの全投稿を表示するTLのためにサーバーIDも記録する
    if (server_id) {
        query.server_id = server_id
    }

    if (typeof params.entities === "object" && Object.keys(params.entities).length > 0) {
        query.entities = params.entities
    }

    if (params.do_not_notify === true) {
        query.do_not_notify = true
    }

    const collection = db.collection("statuses")

    // 最初の投稿は本人以外にできないようにする
    if (recipient_id) {
        const status = await collection.findOne({ recipient_id, server_id })
        if (status === null) {
            if (user_id.equals(recipient_id) === false) {
                throw new Error("最初の投稿は本人以外にはできません")
            }
        }
    }

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