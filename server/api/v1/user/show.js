import { ObjectID } from "mongodb"
import config from "../../../config/beluga"

export default async (db, params) => {
	if (!!params.id == false && !!params.name == false) {
		throw new Error("パラメータを指定してください")
	}
	let query = null
	if (!!params.id) {
		if (typeof params.id === "string") {
			try {
				params.id = ObjectID(params.id)
			} catch (error) {
				throw new Error("idが不正です")
			}
		}
		if (!(params.id instanceof ObjectID)) {
			throw new Error("idが不正です")
		}
		query = { "_id": params.id }
	}
	if (!!params.name) {
		if (typeof params.name !== "string") {
			throw new Error("nameが不正です")
		}
		if (params.name.length == 0) {
			throw new Error("nameを指定してください")
		}
		if (params.name.length > config.user.max_name_length) {
			throw new Error(`nameは${config.user.max_name_length}文字を超えてはいけません`)
		}
		if (params.name.match(config.user.name_regexp) === null) {
			throw new Error(`nameには半角英数字と_のみ使用できます`)
		}
		query = { "name": params.name }
	}
	if(query === null){
		throw new Error("サーバーで問題が発生しました")
	}

	const collection = db.collection("users")
	const user = await collection.findOne(query)
	if(user === null){
		return null
	}
	user.id = user._id
	for(const key in user){
		if(key.indexOf("_") == 0){
			delete user[key]
		}
	}
	return user
}