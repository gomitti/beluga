import * as assert from "../../../assert"
import config from "../../../beluga.config"
const bcrypt = require("bcrypt");

export default async (db, params) => {
	try {
		assert.checkKeyExists("name", params)
		assert.checkKeyExists("raw_password", params)
		assert.checkIsString(params.name)
		assert.checkIsString(params.raw_password)
	} catch (error) {
		throw new Error("サーバーで問題が発生しました")
	}
	if (params.name.length == 0) {
		throw new Error("ユーザー名を入力してください")
	}
	if (params.name.length > config.user.max_name_length) {
		throw new Error("ユーザー名が間違っています")
	}
	if (params.name.match(config.user.name_regexp) === null) {
		throw new Error("ユーザー名が間違っています")
	}
	if (params.raw_password.length == 0) {
		throw new Error("パスワードを入力してください")
	}
	if (params.raw_password.length + config.auth.salt.length > 72) {	// bcryptは72文字以降を切り捨てる
		throw new Error("パスワードが間違っています")
	}
	if (params.raw_password.match(config.auth.password_regexp) === null) {
		throw new Error("パスワードが間違っています")
	}
	const collection = db.collection("users")
	const user = await collection.findOne({ "name": params.name })
	if (user === null) {
		throw new Error("ユーザー名が間違っています")
	}
	const true_password_hash = user._password_hash
	const raw_password = params.raw_password + config.auth.salt
	const success = await bcrypt.compare(raw_password, true_password_hash);
	if (success !== true) {
		throw new Error("パスワードが間違っています")
	}
	return user
}