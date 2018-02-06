import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import memcached from "../../../memcached"

export default async (db, params) => {
	const hashtag = await memcached.v1.hashtag.show(db, params)
	return hashtag
}