import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

const build_query_by_id = params => {
    return {
        "_id": try_convert_to_object_id(params.id, "$idが不正です")
    }
}

const build_query_by_name = params => {
    const { name } = params
    if (typeof name !== "string") {
        throw new Error("nameが不正です")
    }
    if (name.length == 0) {
        throw new Error("nameを指定してください")
    }
    if (name.length > config.community.max_name_length) {
        throw new Error(`nameは${config.community.max_name_length}文字を超えてはいけません`)
    }
    if (name.match(new RegExp(`^${config.community.name_regexp}$`)) === null) {
        throw new Error(`nameには半角英数字と_のみ使用できます`)
    }
    return { name }
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
    if (!!params.id == false && !!params.name == false) {
        throw new Error("パラメータを指定してください")
    }

    const query = build_query(params)

    const collection = db.collection("communities")
    const community = await collection.findOne(query)
    if (community === null) {
        return null
    }
    community.id = community._id
    for (const key in community) {
        if (key.indexOf("_") == 0) {
            delete community[key]
        }
    }
    return community
}