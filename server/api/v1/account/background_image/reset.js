import { ObjectID } from "mongodb"
import config from "../../../../config/beluga"
import assert from "../../../../assert"

export default async (db, params) => {
	const { storage } = params
	let { user_id } = params

	if (typeof user_id === "string") {
		try {
			user_id = ObjectID(user_id)
		} catch (error) {
			throw new Error("不正なユーザーです")
		}
	}
	assert(user_id instanceof ObjectID, "不正なユーザーです")

	const collection = db.collection("users")
	const user = await collection.findOne({ "_id": params.user_id })
	assert(user, "ユーザーが存在しません")

	if (!user.profile) {
		user.profile = {}
	}

	const profile = Object.assign({
		"location": "",
		"description": "",
		"theme_color": config.user.profile.default_theme_color,
		"tags": []
	}, user.profile, {
		"use_background_image": false,
		"background_image": null,
	})

	await collection.updateOne({ "_id": params.user_id }, {
		"$set": { profile }
	})

	return true
}