import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import memcached from "../../../memcached"

export default async (db, params) => {
	params = Object.assign({
		"trim_favorited_by": true,
	}, params)

	const status = await memcached.v1.status.show(db, { "id": params.id })
	if (!status) {
		return status
	}

	status.reactions = await memcached.v1.reaction.show(db, { "status_id": params.id })

	status.favorited_by = []
	if (status.favorites_count > 0 && params.trim_favorited_by === false) {
		const user_ids = await memcached.v1.favorite.favorited_by(db, { "status_id": status.id })
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
		if (status.favorites_count === 0) {
			status.favorited = false
		} else {
			status.favorited = await memcached.v1.favorite.favorited(db, {
				"user_id": params.user_id,
				"status_id": status.id
			})
		}
	}

	return status
}