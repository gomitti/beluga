import config from "../../config/beluga"

export class Memcached {
	constructor(fn){
		this.cache = {}
		this.fn = fn
	}
	delete(key) {
		if (typeof key !== "string") {
			return
		}
		if (key in this.cache) {
			delete this.cache[key]
		}
	}
	async fetch(key, db, params) {
		if (typeof key !== "string") {
			return null
		}
		if (key in this.cache) {
			const obj = this.cache[key];
			if (obj.expires > Date.now()) {
				obj.hit += 1
				return obj.data
			}
			delete this.cache[key]
		}

		const data = await this.fn(db, params)
		if (data === null) {
			return data
		}

		if (Object.keys(this.cache).length > config.memcached.capacity) {
			this.cache = {}
		}

		this.cache[key] = {
			"expires": Date.now() + config.memcached.max_age * 1000,
			"hit": 0,
			data
		}
		return data
	}
}