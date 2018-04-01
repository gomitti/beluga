import { ObjectID } from "mongodb"
import assert, { is_string } from "../../../assert"
import config from "../../../config/beluga"
import storage from "../../../config/storage"
import bcrypt from "bcrypt"

export default async (db, params) => {
	if (is_string(params.name) === false) {
		throw new Error("ユーザー名を入力してください")
	}
	if (params.name.length == 0) {
		throw new Error("ユーザー名を入力してください")
	}
	if (params.name.length > config.user.max_name_length) {
		throw new Error(`ユーザー名は${config.user.max_name_length}文字を超えてはいけません`)
	}
	if (params.name.match(new RegExp(`^${config.user.name_regexp}$`)) === null) {
		throw new Error(`ユーザー名に使用できない文字が含まれています`)
	}

	if (is_string(params.raw_password) === false) {
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

	if (is_string(params.ip_address) === false) {
		throw new Error("サーバーで問題が発生しました")
	}

	let password_hash = null
	try {
		password_hash = await bcrypt.hash(params.raw_password + config.auth.salt, config.auth.bcrypt_salt_round);
	} catch (error) {
		throw new Error("サーバーで問題が発生しました")
	}
	const collection = db.collection("users")

	const accounts = await collection.find({ "_ip_address": params.ip_address }).toArray()
	if (accounts.length >= config.account.max_num_accounts_per_ip_address) {
		throw new Error(`アカウントは1人${config.account.max_num_accounts_per_ip_address}個まで作成できます`)
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
	// const user_id = result.ops[0]
	const user_id = result.insertedId
	assert(user_id instanceof ObjectID, "@user_id must be an instance of ObjectID")

	await db.collection("password").insertOne({
		user_id, password_hash
	})

	return user_id
}