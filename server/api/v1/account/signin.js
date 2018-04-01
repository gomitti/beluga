import config from "../../../config/beluga"
import assert, { is_string } from "../../../assert"
import bcrypt from "bcrypt"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")
    assert(is_string(params.raw_password), "パスワードを入力してください")
    assert(params.raw_password.length > 0, "パスワードを入力してください")
    assert(params.raw_password.length + config.auth.salt.length <= 72, "パスワードが間違っています")	// bcryptは72文字以降を切り捨てる
    assert(params.raw_password.match(config.auth.password_regexp), "パスワードが間違っています")

    const user = db.collection("users").findOne({ "_id": user_id })
    assert(user, "存在しないユーザーです")

    const collection = db.collection("password")
    const row = await collection.findOne({ user_id })
    assert(row, "存在しないユーザーです")
    assert(is_string(row.password_hash), "パスワードが設定されていません")

    const true_password_hash = row.password_hash
    const raw_password = params.raw_password + config.auth.salt
    const success = await bcrypt.compare(raw_password, true_password_hash);
    assert(success, "パスワードが間違っています")

    return true
}