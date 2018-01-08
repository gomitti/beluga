import "babel-polyfill"
import mongo from "./mongo"
import beluga from "./api"

const MongoClient = require("mongodb").MongoClient

const signup = async (db) => {
	const params = {
		"name": "test",
		"ip_address": "",
		"raw_password": "password"
	}
	return beluga.v1.user.signup(db, params)
}

const create_server = async (db, user) => {
	const params = {
		"name": "test",
		"display_name": "test",
		"user_id": user._id
	}
	return beluga.v1.server.create(db, params)
}

const create_hashtag = async (db, user, server) => {
	const params = {
		"tagname": "test",
		"user_id": user._id,
		"server_id": server._id
	}
	return beluga.v1.hashtag.create(db, params)
}

const insert_statuses = async (db, user, hashtag) => {
	const params = {
		"text": "あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。",
		"user_id": user._id,
	}
	for (let i = 0; i < 100000; i++) {
		await beluga.v1.status.update(db, params)
	}
	for (let i = 0; i < 100000; i++) {
		await beluga.v1.status.update(db, Object.assign({ "hashtag_id": hashtag._id }, params))
	}
}

(async () => {
	try {
		const client = await MongoClient.connect(mongo.url)
		const db = client.db(mongo.database.test)

		db.collection("users").deleteMany({})
		db.collection("servers").deleteMany({})
		db.collection("hashtags").deleteMany({})
		
		const user = await signup(db)
		console.log(user)
		const server = await create_server(db, user)
		console.log(server)
		const hashtag = await create_hashtag(db, user, server)
		console.log(hashtag)

		db.collection("statuses").createIndex({ "hashtag_id": -1 });
		// db.collection("statuses").dropIndex({ "hashtag_id": -1 });
		// await insert_statuses(db, user, hashtag)
		console.log("done")

		console.time("statuses");
		await beluga.v1.timeline.hashtag(db, {
			"id": hashtag._id
		})
		console.timeEnd("statuses");

		client.close()
	} catch (error) {
		console.log(error)
	}
})()