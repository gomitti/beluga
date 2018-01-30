import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import memcached from "../../../memcached"

export default async (db, params) => {
	params = Object.assign({
		"trim_user": true,
		"trim_recipient": true,
		"trim_server": true,
		"trim_hashtag": true,
		"trim_favorited_by": true,
	}, params)

	const status = await memcached.v1.status.show(db, params)
	if (status === null) {
		return status
	}

	status.reactions = await memcached.v1.reaction.show(db, { "status_id": params.id })

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

	status.favorited_by = []
	if (status.favorites_count > 0 && params.trim_favorited_by === false) {
		const user_ids = await memcached.v1.favorite.favorited_by(db, {	"status_id": status.id })
		for (const user_id of user_ids) {
			const user = await memcached.v1.user.show(db, { "id": user_id })
			if (user) {
				status.favorited_by.push(user)
			}
		}
	}

	if (typeof params.user_id === "string") {
		try {
			params.user_id = ObjectID(params.user_id)
		} catch (error) {
			throw new Error("user_idが不正です")
		}
	}
	if (params.user_id instanceof ObjectID) {
		status.favorited = await memcached.v1.favorite.favorited(db, {
			"user_id": params.user_id,
			"status_id": status.id
		})
	}

	return status
}