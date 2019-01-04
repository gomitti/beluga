import config from "../../../config/beluga"
import { is_string } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const { name, display_name } = params
    if (is_string(name) === false) {
        throw new Error("サーバー名を入力してください")
    }
    if (name.length == 0) {
        throw new Error("サーバー名を入力してください")
    }
    if (name.length > config.server.max_name_length) {
        throw new Error(`サーバー名は${config.server.max_name_length}文字を超えてはいけません`)
    }
    if (name.match(new RegExp(`^${config.server.name_regexp}$`)) === null) {
        throw new Error("サーバー名に使用できない文字が含まれています")
    }

    if (is_string(display_name) === false) {
        throw new Error("表示名を入力してください")
    }
    if (display_name.length == 0) {
        throw new Error("表示名を入力してください")
    }
    if (display_name.length > config.server.max_display_name_length) {
        throw new Error(`表示名は${config.server.max_display_name_length}文字を超えてはいけません`)
    }

    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    const collection = db.collection("servers")

    const existing = await collection.findOne({ "name": name })
    if (existing !== null) {
        throw new Error(`${name}はすでに存在するため、違うサーバー名に変更してください`)
    }

    config.server.reserved_names.forEach(reserved_name => {
        if (reserved_name === name) {
            throw new Error(`サーバー名を${name}に設定することはできません`)
        }
    })

    const multipost = await collection.findOne({ "created_by": user_id })
    if (multipost !== null) {
        // throw new Error("サーバーを複数作成することはできません")
    }

    const result = await collection.insertOne({
        name,
        display_name,
        "description": "",
        "statuses_count": 0,
        "created_at": Date.now(),
        "created_by": user_id
    })
    const server = result.ops[0]
    server.id = server._id
    delete server._id
    return server
}