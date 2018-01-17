import "babel-polyfill"
import { ObjectID } from "mongodb"
import mongo from "./mongo"
import api from "./api"
import storage from "./config/storage"
import { hash } from "bcrypt/bcrypt";

const MongoClient = require("mongodb").MongoClient

const signup = async (db) => {
	const params = {
		"name": "test",
		"ip_address": "",
		"raw_password": "password"
	}
	const user = await api.v1.account.signup(db, params)
	user.id = user._id
	delete user._id
	return user
}

const create_server = async (db, user) => {
	const params = {
		"name": "test",
		"display_name": "test",
		"user_id": user.id
	}
	return api.v1.server.create(db, params)
}

const create_hashtag = async (db, user, server) => {
	const params = {
		"tagname": "test",
		"user_id": user.id,
		"server_id": server.id
	}
	return api.v1.hashtag.create(db, params)
}

const insert_statuses = async (db, user, hashtag, server) => {
	const params = {
		"text": "あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。",
		"user_id": user.id,
	}
	for (let i = 0; i < 500000; i++) {
		await api.v1.status.update(db, Object.assign({ "hashtag_id": hashtag.id }, params))
		await api.v1.status.update(db, Object.assign({ "hashtag_id": ObjectID.createFromTime(Date.now()) }, params))
	}
	for (let k = 0; k < 100; k++) {
		await api.v1.status.update(db, Object.assign({
			"recipient_id": user.id,
			"server_id": server.id,
		}, params))
		for (let i = 0; i < 10000; i++) {
			await api.v1.status.update(db, Object.assign({
				"recipient_id": ObjectID.createFromTime(Date.now()),
				"server_id": ObjectID.createFromTime(Date.now()),
			}, params))
		}
	}
}

(async () => {
	try {
		const client = await MongoClient.connect(mongo.url)

		if (true) {
			const db = client.db(mongo.database.production)
			if (false) {
				const collection = db.collection("users")
				const users = await collection.find({}).toArray()
				const remote = storage.servers[0]
				for (const user of users) {
					user.id = user._id
					const url = await api.v1.account.avatar.reset(db, user, remote)
					console.log(url)
				}
			}
			if (false) {
				const collection = db.collection("servers")
				const servers = await collection.find({}).toArray()
				const remote = storage.servers[0]
				for (const server of servers) {
					server.id = server._id
					const url = await api.v1.server.avatar.reset(db, server, remote)
					console.log(url)
				}
			}
			if (true) {
				const collection = db.collection("hashtags")
				const hashtags = await collection.find({}).toArray()
				for (const hashtag of hashtags) {
					const count = await db.collection("statuses").find({ "hashtag_id": hashtag._id }).count()
					console.log(hashtag._id, count)
					collection.updateOne({ "_id": hashtag._id }, { $set: { "statuses_count": count } })
				}
			}
			return
		}












		const db = client.db(mongo.database.test)
		console.log(mongo.database.test)

		// db.collection("users").deleteMany({})
		// db.collection("servers").deleteMany({})
		// db.collection("hashtags").deleteMany({})

		// const user = await signup(db)
		// console.log(user)
		// const server = await create_server(db, user)
		// console.log(server)
		// const hashtag = await create_hashtag(db, user, server)
		// console.log(hashtag)

		// await insert_statuses(db, user, hashtag, server)
		// console.log("done")




		const user = (await db.collection("users").find({}).toArray())[0]
		const hashtag = (await db.collection("hashtags").find({}).toArray())[0]
		const server = (await db.collection("servers").find({}).toArray())[0]
		user.id = user._id
		hashtag.id = hashtag._id
		server.id = server._id
		console.log(user)
		console.log(hashtag)
		console.log(server)



		// db.collection("statuses").createIndex({ "hashtag_id": -1, "_id": -1 })
		// db.collection("statuses").createIndex({ "recipient_id": -1, "server_id": -1, "_id": -1 })

		// db.collection("statuses").dropIndex({ "recipient_id": -1, "server_id": -1, "_id": -1 })
		// db.collection("statuses").dropIndex({ "hashtag_id": -1, "_id": -1 })

		console.time("hashtag");
		await api.v1.timeline.hashtag(db, {
			"id": hashtag.id,
			"trim_user": true,
			"max_id": "5a5599476daefccff4cc5292",
			"sort": -1,
			"count": 30
		})
		console.timeEnd("hashtag");
		console.time("home");
		await api.v1.timeline.home(db, {
			"user_id": user.id,
			"server_id": server.id,
			"trim_user": true,
			"max_id": "5a5599476daefccff4cc5292",
			"sort": -1,
			"count": 30
		})
		console.timeEnd("home");

		client.close()
	} catch (error) {
		console.log(error)
	}
})()