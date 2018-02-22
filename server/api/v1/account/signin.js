import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import assert, { is_string } from "../../../assert"
import bcrypt from "bcrypt"

export default async (db, params) => {
	if (typeof params.user_id === "string") {
		try {
			params.user_id = ObjectID(params.user_id)
		} catch (error) {
			throw new Error("存在しないユーザーです")
		}
	}
	assert(params.user_id instanceof ObjectID, "存在しないユーザーです")
	assert(is_string(params.raw_password), "パスワードを入力してください")
	assert(params.raw_password.length > 0, "パスワードを入力してください")
	assert(params.raw_password.length + config.auth.salt.length <= 72, "パスワードが間違っています")	// bcryptは72文字以降を切り捨てる
	assert(params.raw_password.match(config.auth.password_regexp), "パスワードが間違っています")

	const user = db.collection("users").findOne({ "_id": params.user_id })
	assert(user, "存在しないユーザーです")
	
	const collection = db.collection("password")
	const row = await collection.findOne({ "user_id": params.user_id })
	assert(row, "存在しないユーザーです")
	assert(is_string(row.password_hash), "サーバーで問題が発生しました")
	
	const true_password_hash = row.password_hash
	const raw_password = params.raw_password + config.auth.salt
	const success = await bcrypt.compare(raw_password, true_password_hash);
	assert(success, "パスワードが間違っています")
	
	return true
}