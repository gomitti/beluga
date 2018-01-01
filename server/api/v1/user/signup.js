import * as assert from "../../../assert"
import config from "../../../beluga.config"
const bcrypt = require("bcrypt");

export default async (db, params) => {
	try {
		assert.checkKeyExists("name", params)
		assert.checkKeyExists("ip_address", params)
		assert.checkKeyExists("raw_password", params)
		assert.checkIsString(params.name)
		assert.checkIsString(params.ip_address)
		assert.checkIsString(params.raw_password)
	} catch (error) {
		throw new Error("サーバーで問題が発生しました")
	}
	if (params.name.length == 0) {
		throw new Error("ユーザー名を入力してください")
	}
	if (params.name.length > config.user.max_name_length) {
		throw new Error(`ユーザー名は${config.user.max_name_length}文字を超えてはいけません`)
	}
	if (params.name.match(config.user.name_regexp) === null) {
		throw new Error(`ユーザー名には半角英数字と_のみ使用できます`)
	}
	if (params.raw_password.length == 0) {
		throw new Error("パスワードを入力してください")
	}
	if (params.raw_password.length + config.auth.salt.length > 72) {	// bcryptは72文字以降を切り捨てる
		throw new Error(`パスワードは${72 - config.auth.salt.length}文字を超えてはいけません`)
	}
	if (params.raw_password.match(config.auth.password_regexp) === null) {
		throw new Error(`パスワードには半角英数字と記号のみ使用できます`)
	}
	let password_hash = null
	try {
		password_hash = await bcrypt.hash(params.raw_password + config.auth.salt, config.auth.bcrypt_salt_round);
	} catch (error) {
		throw new Error("サーバーで問題が発生しました")
	}
	const collection = db.collection("users")

	const multipost = await collection.find({ "_ip_address": params.ip_address }).toArray()
	if (multipost.length > 0) {
		throw new Error(`アカウントの連続作成はできません`)
	}

	const existing = await collection.find({ "name": params.name }).toArray()
	if (existing.length > 0) {
		throw new Error(`@${params.name}はすでに存在するため違うユーザー名に変更してください`)
	}

	const result = await collection.insertOne({
		"name": params.name,
		"screen_name": "",
		"location": "",
		"description": "",
		"statuses_count": 0,
		"tags": [],
		"following": [],
		"followers": [],
		"created_at": new Date().getTime(),
		"_ip_address": params.ip_address,
		"_password_hash": password_hash
	})
	return true
}