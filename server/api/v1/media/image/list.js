import { ObjectID } from "mongodb"
import storage from "../../../../config/storage"
import config from "../../../../config/beluga"

const map_host_uri = {}
for (const server of storage.servers) {
	const protocol = server.https ? "https" : "http"
	map_host_uri[server.host] = `${protocol}://${server.url_prefix}.${server.domain}`
}

export default async (db, params) => {
	params = Object.assign({
		"count": config.media.list.count.default
	}, params)

	if (!!params.user_id == false) {
		throw new Error("user_idを指定してください")
	}
	let query = null
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

	const collection = db.collection("media")
	const media = await collection.find({ "user_id": params.user_id }).sort({ "created_at": -1 }).limit(params.count).toArray()
	const list = []
	for (const item of media) {
		const { suffix, extension, host, directory } = item
		if (!(suffix && extension && host && directory)) {
			continue
		}
		const uri = map_host_uri[host]
		if(!uri){
			continue
		}
		const source = `${uri}/${directory}/${suffix}.${extension}`
		list.push(source)
	}
	return list
}