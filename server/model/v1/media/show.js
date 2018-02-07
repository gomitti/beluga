import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import storage from "../../../config/storage"
import memcached from "../../../memcached"

const map_host_uri = {}
for (const server of storage.servers) {
	const protocol = server.https ? "https" : "http"
	map_host_uri[server.host] = `${protocol}://${server.url_prefix}.${server.domain}`
}

export default async (db, params) => {
	const media = await memcached.v1.media.show(db, { "id": params.id })

	const { suffix, extension, host, directory, id } = media
	if (!(suffix && extension && host && directory)) {
		return null
	}
	const uri = map_host_uri[host]
	if (!uri) {
		return null
	}
	const source = `${uri}/${directory}/${suffix}.${extension}`
	return {
		source,
		uri,
		directory,
		suffix,
		extension,
		id,
		"is_video": !!media.is_video,
		"is_image": !!media.is_image,
	}
}