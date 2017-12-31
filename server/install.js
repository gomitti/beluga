import "babel-polyfill"
import * as mongo from "./mongo"
const MongoClient = require("mongodb").MongoClient


// ユーザー名の予約語を登録
async function register_reserved_names(db){
	const collection = db.collection("users")
	const reserved_names = [
		"admin", "beluga"
	]
	for (const name of reserved_names) {
		try {
			const existing = await collection.find({ name }).toArray()
			if (existing.length > 0) {
				continue
			}
			const result = await collection.insertOne({
				"name": name
			})
		} catch (error) {
			console.log(error)
		}
	}
}

// データベースの初期化を行う
(async () => {
	try {
		const client = await MongoClient.connect(mongo.url)
		console.log("MongoDBへ接続")
		const db = client.db(mongo.name)
		await register_reserved_names(db)
		client.close()
	} catch (error) {
		console.log(error)
	}

})()