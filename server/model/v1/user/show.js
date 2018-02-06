import { ObjectID } from "mongodb"
import config from "../../../config/beluga"
import memcached from "../../../memcached"

export default async (db, params) => {
	params = Object.assign({
		"trim_profile": true,
	}, params)

	const user = await memcached.v1.user.show(db, { "id": params.id, "name": params.name })
	if (user === null) {
		return user
	}

	if (params.trim_profile) {
		delete user.profile
	}

	return user
}