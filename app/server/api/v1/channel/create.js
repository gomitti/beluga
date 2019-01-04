import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"
import { is_string, is_bool } from "../../../assert"

export default async (db, params) => {
    const { name } = params
    if (is_string(name) === false) {
        throw new Error("チャンネル名を指定してください")
    }
    if (name.length > config.channel.max_name_length) {
        throw new Error(`チャンネル名は${config.channel.max_name_length}文字を超えてはいけません`)
    }

    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")
    const server_id = try_convert_to_object_id(params.server_id, "$server_idが不正です")

    const collection = db.collection("channels")

    const existing = await collection.findOne({ name, server_id })
    if (existing !== null) {
        throw new Error(`#${name}はすでに存在するため、違うチャンネル名に変更してください`)
    }

    config.channel.reserved_names.forEach(reserved_name => {
        if (reserved_name === name) {
            throw new Error(`チャンネル名を${name}に設定することはできません`)
        }
    })

    const attributes = {
        "is_public": true,
        "invitation_needed": false,
    }
    for (const key in attributes) {
        if (params.hasOwnProperty(key) && is_bool(params[key])) {
            attributes[key] = params[key]
        }
    }


    const result = await collection.insertOne(Object.assign({
        server_id,
        name,
        "description": "",
        "statuses_count": 0,
        "created_at": Date.now(),
        "created_by": params.user_id
    }, attributes))
    const channel = result.ops[0]
    channel.id = channel._id
    delete channel._id
    return channel
}