import config from "../../config/beluga"

export class Memcached {
	constructor(fn) {
		this.cache = {}
		this.fn = fn
	}
	delete_recursively(keys) {
		if (!(keys instanceof Array)) {
			return false
		}
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
	}
	fetch_recursively(keys) {
		if (!(keys instanceof Array)) {
			return null
		}
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
		if(!(keys instanceof Array)){
			return
		}
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
			"expires": Date.now() + config.memcached.max_age * 1000,
			"hit": 0,
			data
		}
	}
	async fetch(key, db, params) {
		if (typeof key === "string") {
			key = [key]
		}
		if (!(key instanceof Array)) {
			return null
		}

		const obj = this.fetch_recursively(key)
		if (obj) {
			if (obj.expires > Date.now()) {
				obj.hit += 1
				if (obj.data instanceof Array) {
					return obj.data
				}
				return Object.assign({}, obj.data)
			}
			this.delete_recursively(key)
		}

		const data = await this.fn(db, params)
		if (data === null) {
			return data
		}

		if (Object.keys(this.cache).length > config.memcached.capacity) {
			this.cache = {}
		}

		this.store_recursively(key, data)

		if (data instanceof Array) {
			return data
		}
		return Object.assign({}, data)
	}
}