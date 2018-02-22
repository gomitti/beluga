import assert from "../../../assert"
import config from "../../../config/beluga"
import storage from "../../../config/storage"
import bcrypt from "bcrypt"

export default async (db, params) => {
	if (assert.is_string(params.name) === false) {
		throw new Error("ユーザー名を入力してください")
	}
	if (params.name.length == 0) {
		throw new Error("ユーザー名を入力してください")
	}
	if (params.name.length > config.user.max_name_length) {
		throw new Error(`ユーザー名は${config.user.max_name_length}文字を超えてはいけません`)
	}
	if (params.name.match(config.user.name_regexp) === null) {
		throw new Error(`ユーザー名に使用できない文字が含まれています`)
	}

	if (assert.is_string(params.raw_password) === false) {
		throw new Error("パスワードを入力してください")
	}
	if (params.raw_password.length == 0) {
		throw new Error("パスワードを入力してください")
	}
	if (params.raw_password.length < config.auth.min_password_length) {
		throw new Error(`パスワードを${config.auth.min_password_length}文字以上で入力してください`)
	}
	if (params.raw_password.length + config.auth.salt.length > 72) {	// bcryptは72文字以降を切り捨てる
		throw new Error(`パスワードは${72 - config.auth.salt.length}文字を超えてはいけません`)
	}
	if (params.raw_password.match(config.auth.password_regexp) === null) {
		throw new Error(`パスワードに使用できない文字が含まれています`)
	}

	if (assert.is_string(params.ip_address) === false) {
		throw new Error("サーバーで問題が発生しました")
	}

	let password_hash = null
	try {
		password_hash = await bcrypt.hash(params.raw_password + config.auth.salt, config.auth.bcrypt_salt_round);
	} catch (error) {
		throw new Error("サーバーで問題が発生しました")
	}
	const collection = db.collection("users")

	const multipost = await collection.findOne({ "_ip_address": params.ip_address })
	if (multipost !== null) {
		throw new Error("アカウントの連続作成はできません")
	}

	const existing = await collection.findOne({ "name": params.name })
	if (existing !== null) {
		throw new Error(`@${params.name}はすでに存在するため、違うユーザー名に変更してください`)
	}

	const result = await collection.insertOne({
		"name": params.name,
		"display_name": "",
		"location": "",
		"description": "",
		"statuses_count": 0,
		"created_at": Date.now(),
		"_ip_address": params.ip_address,
	})
	const user_id = result.ops[0]

	await db.collection("password").insertOne({
		user_id, password_hash
	})

	return user_id
}