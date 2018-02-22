import config from "../../config/beluga"
import assert from "../../assert"

export class Memcached {
	// @max_age 秒
	constructor(fn, max_age) {
		this.cache = {}
		this.fn = fn
		this.max_age = max_age || config.memcached.max_age
	}
	delete_recursively(keys) {
		assert(keys instanceof Array, "@keys must be an array")
		let root = this.cache
		for (let i = 0; i < keys.length - 1; i++) {
			const key = keys[i]
			if (key in root) {
				root = root[key]
			} else {
				return false
			}
		}
		const key = keys[keys.length - 1]
		if (key in root) {
			delete root[key]
			return true
		}
		return false
	}
	delete(key) {
		if (typeof key === "string") {
			return this.delete_recursively([key])
		}
		if (key instanceof Array) {
			return this.delete_recursively(key)
		}
		assert(false, "Invalid key")
	}
	fetch_recursively(keys) {
		assert(keys instanceof Array, "@keys must be an array")
		let root = this.cache
		for (let i = 0; i < keys.length - 1; i++) {
			const key = keys[i]
			if (key in root) {
				root = root[key]
			} else {
				return null
			}
		}
		const key = keys[keys.length - 1]
		if (key in root) {
			return root[key]
		}
		return null
	}
	store_recursively(keys, data) {
		assert(keys instanceof Array, "@keys must be an array")
		let root = this.cache
		for (let i = 0; i < keys.length - 1; i++) {
			const key = keys[i]
			if (key in root) {
				root = root[key]
			} else {
				root[key] = {}
				root = root[key]
			}
		}
		const key = keys[keys.length - 1]
		root[key] = {
			"expires": Date.now() + this.max_age * 1000,	// Date.now()はミリ秒
			"hit": 0,
			data
		}
	}
	async fetch(keys, db, params) {
		if (typeof keys === "string") {
			keys = [keys]
		}
		assert(keys instanceof Array, "@keys must be an array")

		const obj = this.fetch_recursively(keys)
		if (obj) {
			if (obj.expires > Date.now()) {
				obj.hit += 1
				if (obj.data instanceof Array) {
					return obj.data
				}
				return Object.assign({}, obj.data)	// コピーを送る（ただしshallow copyなので注意）
			}
			this.delete_recursively(keys)
		}

		const data = await this.fn(db, params)
		if (data === null) {
			return data
		}

		if (Object.keys(this.cache).length > config.memcached.capacity) {
			this.cache = {}
		}

		this.store_recursively(keys, data)

		if (data instanceof Array) {
			return data
		}
		return Object.assign({}, data)	// コピーを送る（ただしshallow copyなので注意）
	}
}