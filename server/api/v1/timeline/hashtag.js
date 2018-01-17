import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import fetch from "./fetch"

export default async (db, params) => {
	if (typeof params.id === "string") {
		try {
			params.id = ObjectID(params.id)
		} catch (error) {
			throw new Error("idが不正です")
		}
	}
	if (!(params.id instanceof ObjectID)) {
		throw new Error("idが不正です")
	}
	
	return fetch(db, {
		"hashtag_id": params.id
	}, params)
}