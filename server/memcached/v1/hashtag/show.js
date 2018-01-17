import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import api from "../../../api"

export let cache = {}

export default async (db, params) => {
	if (typeof params.id === "string") {
		try {
			params.id = ObjectID(params.id)
		} catch (error) {
			throw new Error("idが不正です")
		}
	}
	if (!(params.id instanceof ObjectID)) {
		return await api.v1.hashtag.show(db, params)		// タグ名とサーバーを指定している場合は面倒なのでキャッシュしない
	}

	const key = params.id.toHexString()
	if (key in cache) {
		const obj = cache[key];
		if (obj.expires > Date.now()) {
			obj.hit += 1
			return obj.data
		}
		delete cache[key]
	}

	const hashtag = await api.v1.hashtag.show(db, params)
	if (hashtag === null) {
		return hashtag
	}

	if (Object.keys(cache).length > config.memcached.capacity) {
		cache = {}
	}

	cache[key] = {
		"expires": Date.now() + config.memcached.max_age * 1000,
		"hit": 0,
		"data": hashtag
	}
	return hashtag
}