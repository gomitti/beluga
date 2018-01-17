import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import fetch from "./fetch"

export default async (db, params) => {
	if (typeof params.server_id === "string") {
		try {
			params.server_id = ObjectID(params.server_id)
		} catch (error) {
			throw new Error("server_idが不正です")
		}
	}
	if (!(params.server_id instanceof ObjectID)) {
		throw new Error("server_idが不正です")
	}

	return fetch(db, {
		"server_id": params.server_id
	}, params)
}