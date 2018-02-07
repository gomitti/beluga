import { ObjectID } from "mongodb"
import storage from "../../../../../config/storage"
import config from "../../../../../config/beluga"

const map_host_uri = {}
for (const server of storage.servers) {
	const protocol = server.https ? "https" : "http"
	map_host_uri[server.host] = `${protocol}://${server.url_prefix}.${server.domain}`
}

export default async (db, params) => {
	if (!params.user_id) {
		throw new Error("user_idを指定してください")
	}
	if (typeof params.user_id === "string") {
		try {
			params.user_id = ObjectID(params.user_id)
		} catch (error) {
			throw new Error("idが不正です")
		}
	}
	if (!(params.user_id instanceof ObjectID)) {
		throw new Error("idが不正です")
	}

	const collection = db.collection("bookmarks")
	const bookmark = await collection.findOne({ "user_id": params.user_id })
	if (!bookmark) {
		return []
	}
	return bookmark.media_ids || []
}