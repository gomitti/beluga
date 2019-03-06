import config from "../../../config/beluga"
import { is_string } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const { name, display_name } = params
    if (is_string(name) === false) {
        throw new Error("名前を入力してください")
    }
    if (name.length == 0) {
        throw new Error("名前を入力してください")
    }
    if (name.length > config.community.max_name_length) {
        throw new Error(`名前は${config.community.max_name_length}文字を超えてはいけません`)
    }
    if (name.match(new RegExp(`^${config.community.name_regexp}$`)) === null) {
        throw new Error("名前に使用できない文字が含まれています")
    }

    if (is_string(display_name) === false) {
        throw new Error("表示名を入力してください")
    }
    if (display_name.length == 0) {
        throw new Error("表示名を入力してください")
    }
    if (display_name.length > config.community.max_display_name_length) {
        throw new Error(`表示名は${config.community.max_display_name_length}文字を超えてはいけません`)
    }

    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    const collection = db.collection("communities")

    const existing = await collection.findOne({ "name": name })
    if (existing !== null) {
        throw new Error(`${name}はすでに存在するため、違うコミュニティ名に変更してください`)
    }

    config.community.reserved_names.forEach(reserved_name => {
        if (reserved_name === name) {
            throw new Error(`コミュニティ名を${name}に設定することはできません`)
        }
    })

    const count = await collection.find({ "created_by": user_id }).count()
    if (count >= config.community.max_num_communities_user_can_create) {
        throw new Error("コミュニティ作成数の上限に達したため、これ以上作成することができません")
    }

    const result = await collection.insertOne({
        name,
        display_name,
        "description": "",
        "statuses_count": 0,
        "created_at": Date.now(),
        "only_admin_can_add_emoji": true,
        "created_by": user_id
    })
    const community = result.ops[0]
    community.id = community._id
    delete community._id
    return community
}