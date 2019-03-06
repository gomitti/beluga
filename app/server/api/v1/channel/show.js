import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"
import { is_string } from "../../../assert"

const build_query_by_id = params => {
    return {
        "_id": try_convert_to_object_id(params.id, "$idが不正です")
    }
}

const build_query_by_name = params => {
    const community_id = try_convert_to_object_id(params.community_id, "$community_idが不正です")

    const { name } = params
    if (is_string(name) === false) {
        throw new Error("$nameが不正です")
    }
    if (name.length == 0) {
        throw new Error("$nameを指定してください")
    }
    if (name.length > config.channel.max_name_length) {
        throw new Error(`$nameは${config.channel.max_name_length}文字を超えてはいけません`)
    }

    return { name, community_id }
}

const build_query = params => {
    if (params.id) {
        return build_query_by_id(params)
    }
    if (params.name) {
        return build_query_by_name(params)
    }
    throw new Error("パラメータが不正です")
}

export default async (db, params) => {
    const query = build_query(params)

    const collection = db.collection("channels")
    const channel = await collection.findOne(query)
    if (channel === null) {
        return null
    }
    channel.id = channel._id
    for (const key in channel) {
        if (key.indexOf("_") == 0) {
            delete channel[key]
        }
    }
    return channel
}