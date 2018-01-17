import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import memcached from "../../../memcached"

export default async (db, params) => {
	params = Object.assign({
		"trim_user": true,
		"trim_recipient": true,
		"trim_server": true,
		"trim_hashtag": true,
	}, params)

	const status = await memcached.v1.status.show(db, params)
	if(status === null){
		return status
	}

	if (params.trim_user === false) {
		const user = await memcached.v1.user.show(db, { "id": status.user_id })
		if (!user) {
			return null
		}
		status.user = user
	}

	if (status.recipient_id && params.trim_recipient === false) {
		const recipient = await memcached.v1.user.show(db, { "id": status.recipient_id })
		if (!recipient) {
			return null
		}
		status.recipient = recipient
	}

	if (status.server_id && params.trim_server === false) {
		const server = await memcached.v1.server.show(db, { "id": status.server_id })
		if (!server) {
			return null
		}
		status.server = server
	}

	if (status.hashtag_id && params.trim_hashtag === false) {
		const hashtag = await memcached.v1.hashtag.show(db, { "id": status.hashtag_id })
		if (!hashtag) {
			return null
		}
		status.hashtag = hashtag
	}
	
	return status
}