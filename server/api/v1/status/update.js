import * as assert from "../../../assert"
import config from "../../../beluga.config"

export default async (db, params) => {
	try {
		assert.checkKeyExists("text", params)
		assert.checkKeyExists("user_name", params)
		assert.checkIsString(params.text)
		assert.checkIsString(params.user_name)
	} catch (error) {
		throw new Error("サーバーで問題が発生しました")
	}
	if (params.text.length == 0) {
		throw new Error("本文を入力してください")
	}
	if (params.text.length > config.status.max_text_length) {
		throw new Error(`本文は${config.status.max_text_length}文字以内で入力してください`)
	}
	if (params.user_name.length > config.user.max_name_length) {
		throw new Error(`ユーザー名は${config.user.max_name_length}文字以内で入力してください`)
	}
	const collection = db.collection("statuses")
	const result = await collection.insertOne({
		"text": params.text,
		"user_name": params.user_name,
		"created_at": new Date().getTime()
	})
	return true
}