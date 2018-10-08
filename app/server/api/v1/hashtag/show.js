import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"
import { is_string } from "../../../assert"

const build_query_by_id = params => {
    return {
        "_id": try_convert_to_object_id(params.id, "$idが不正です")
    }
}

const build_query_by_tagname = params => {
    const server_id = try_convert_to_object_id(params.server_id, "$server_idが不正です")

    const { tagname } = params
    if (is_string(tagname) === false) {
        throw new Error("@tagnameが不正です")
    }
    if (tagname.length == 0) {
        throw new Error("@tagnameを指定してください")
    }
    if (tagname.length > config.hashtag.max_tagname_length) {
        throw new Error(`@tagnameは${config.hashtag.max_tagname_length}文字を超えてはいけません`)
    }

    return { tagname, server_id }
}

const build_query = params => {
    if (params.id) {
        return build_query_by_id(params)
    }
    if (params.tagname) {
        return build_query_by_tagname(params)
    }
    throw new Error("パラメータが不正です")
}

export default async (db, params) => {
    const query = build_query(params)

    const collection = db.collection("hashtags")
    const hashtag = await collection.findOne(query)
    if (hashtag === null) {
        return null
    }
    hashtag.id = hashtag._id
    for (const key in hashtag) {
        if (key.indexOf("_") == 0) {
            delete hashtag[key]
        }
    }
    return hashtag
}