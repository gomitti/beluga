const MongoClient = require("mongodb").MongoClient
import { url } from "./mongo"

MongoClient
	.connect(url)
	.then(client => {
		console.log("MongoDBへ接続")
		client.close()
	}).catch(err => {
		console.log("エラー")
		console.log(err)
	})