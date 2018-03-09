import { ObjectID } from "mongodb"
import assert, { is_string, is_number } from "../../assert"
import logger from "../../logger"

export default class Store {
	constructor(db, options) {
		this.collection = db.collection("sessions")
		this.cache = {}
		this.options = Object.assign({
			"max_cache_capacity": 1000
		}, options)
	}
	async get(encrypted_id) {
		// console.log("Store::get", encrypted_id)
		let session = null
		if (encrypted_id in this.cache) {
			// console.log("	hit!")
			session = this.cache[encrypted_id]
			if (session.expires < Date.now()) {
				// console.log("	expired", session.expires, Date.now())
				await this.destroy(encrypted_id)
				return null
			}
			return session
		}
		session = await this.collection.findOne({ "encrypted_id": encrypted_id })
		if (session === null) {
			return null
		}
		if (session.expires < Date.now()) {
			// console.log("	expired", session.expires, Date.now())
			await this.destroy(encrypted_id)
			return null
		}
		this.cache[encrypted_id] = session
		return session
	}
	async save(session) {
		// console.log("Store::save", session)
		try {
			assert(is_string(session.id), "session.id is not string")
			assert(is_string(session.encrypted_id), "session.encrypted_id is not string")
			if (session.user_id !== null) {
				if (!(session.user_id instanceof ObjectID)) {
					throw new Error("不正なユーザーIDです")
				}
			}
			assert(is_number(session.expires), "session.expires is not string")
		} catch (error) {
			logger.log({
				"level": "error",
				"message": "Failed to save session",
				"error": error.toString(),
			})
			throw new Error("セッションを保存できません")
		}
		const _ = await this.get(session.encrypted_id)
		if (_ !== null) {
			throw new Error("セッションが重複しています")
		}
		let row = {
			"id": session.id,
			"encrypted_id": session.encrypted_id,
			"expires": session.expires,
			"user_id": session.user_id
		}
		await this.collection.insertOne(row)
		this.clear_cache_if_needed()
		this.cache[session.id] = session
		return true
	}
	async destroy(encrypted_id) {
		await this.collection.deleteOne({
			"encrypted_id": encrypted_id,
		})
		if (encrypted_id in this.cache) {
			delete this.cache[encrypted_id]
		}
		return true
	}
	async clean() {
		const expires = Date.now()
		const result = await this.collection.deleteMany({ "expires": { $lt: expires } })
	}
	clear_cache_if_needed() {
		if (Object.keys(this.cache).length >= this.options.max_cache_capacity) {
			this.clear_cache()
		}
	}
	clear_cache() {
		delete this.cache
		this.cache = {}
	}
}