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
	
	if (!user.profile) {
		user.profile = {
			"location": "",
			"description": "",
			"theme_color": config.user.profile.default_theme_color,
			"tags": []
		}
	}
	if(!user.display_name){
		user.display_name = ""
	}
	if (params.trim_profile === true) {
		delete user.profile
	}

	return user
}