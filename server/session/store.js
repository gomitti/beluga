import { ObjectID } from "mongodb"
import * as assert from "../assert"

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
		const rows = await this.collection.find({ "encrypted_id": encrypted_id }).toArray()
		if (rows.length !== 1) {
			// console.log("	rows.length !== 1", rows)
			await this.destroy(encrypted_id)
			return null
		}
		session = rows[0]
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
			assert.checkIsString(session.id)
			assert.checkIsString(session.encrypted_id)
			if (session.user_id !== null) {
				if (!(session.user_id instanceof ObjectID) ){
					throw new Error()
				}
			}
			assert.checkIsNumber(session.expires)
		} catch (error) {
			// console.log(error)
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
		this.clearCacheIfNeeded()
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
	async clean(){
		const expires = Date.now()
		const result = await this.collection.deleteMany({ "expires": { $lt: expires} })
	}
	clearCacheIfNeeded() {
		if (Object.keys(this.cache).length >= this.options.max_cache_capacity) {
			this.clearCache()
		}
	}
	clearCache() {
		delete this.cache
		this.cache = {}
	}
}