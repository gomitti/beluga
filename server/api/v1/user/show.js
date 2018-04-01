import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"

const build_query_by_id = params => {
    const id = try_convert_to_object_id(params.id, "@idが不正です")
    return { "_id": id }
}

const build_query_by_name = params => {
    const { name } = params
    if (typeof name !== "string") {
        throw new Error("@nameが不正です")
    }
    if (name.length == 0) {
        throw new Error("@nameを指定してください")
    }
    if (name.length > config.user.max_name_length) {
        throw new Error(`@nameは${config.user.max_name_length}文字を超えてはいけません`)
    }
    if (name.match(new RegExp(`^${config.user.name_regexp}$`)) === null) {
        throw new Error(`@nameには半角英数字と_のみ使用できます`)
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
    throw new Error("パラメータを指定してください")
}

export default async (db, params) => {
    const query = build_query(params)

    const user = await db.collection("users").findOne(query)
    if (user === null) {
        return null
    }

    user.id = user._id
    for (const key in user) {
        if (key.indexOf("_") == 0) {
            delete user[key]
        }
    }
    return user
}