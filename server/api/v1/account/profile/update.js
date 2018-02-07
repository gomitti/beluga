import { ObjectID } from "mongodb"
import config from "../../../../config/beluga"
import logger from "../../../../logger"

export default async (db, params) => {
	if (typeof params.user_id === "string") {
		try {
			params.user_id = ObjectID(params.user_id)
		} catch (error) {
			throw new Error("ログインしてください")
		}
	}
	if (!(params.user_id instanceof ObjectID)) {
		throw new Error("ログインしてください")
	}

	const collection = db.collection("users")
	const user = await collection.findOne({ "_id": params.user_id })
	if (user === null) {
		throw new Error("ユーザーが存在しません")
	}
	if (!user.profile) {
		user.profile = {}
	}

	const query = {}
	const profile = Object.assign({
		"location": "",
		"description": "",
		"theme_color": config.user.profile.default_theme_color,
		"use_background_image": false,
		"tags": []
	}, user.profile)

	if (typeof params.display_name === "string") {
		if (params.display_name.length > config.user.max_display_name_length) {
			throw new Error(`ユーザー名を${config.user.max_display_name_length}文字以内で入力してください。（${params.display_name.length} > ${config.user.max_display_name_length}）`)
		}
		query.display_name = params.display_name
	}

	if (typeof params.theme_color === "string") {
		if (params.theme_color.match(/#[0-9a-fA-F]{6}/) || params.theme_color.match(/#[0-9a-fA-F]{3}/)) {
			profile.theme_color = params.theme_color.toLowerCase()
		}
	}

	if (typeof params.description === "string") {
		if (params.description.length > config.user.profile.max_description_length) {
			throw new Error(`自己紹介を${config.user.profile.max_description_length}文字以内で入力してください。（${params.description.length} > ${config.user.profile.max_description_length}）`)
		}
		profile.description = params.description
	}

	if (typeof params.location === "string") {
		if (params.location.length > config.user.profile.max_location_length) {
			throw new Error(`現在位置を${config.user.profile.max_location_length}文字以内で入力してください。（${params.location.length} > ${config.user.profile.max_location_length}）`)
		}
		profile.location = params.location
	}

	if (params.tags instanceof Array) {
		for (const tag of params.tags) {
			if (typeof tag !== "string") {
				throw new Error("不正なタグが含まれています")
			}
			if (tag.length === 0) {
				throw new Error("文字数が0のタグが含まれています")
			}
			if (tag.length >= config.user.profile.max_tag_length) {
				throw new Error(`タグの文字数は${config.user.profile.max_tag_length}までです。（${tag.length} > ${config.user.profile.max_tag_length}）`)
			}
		}
		if (params.tags.length > config.user.profile.max_num_tags) {
			throw new Error(`タグの個数は${config.user.profile.max_num_tags}までです。（${params.tags.length} > ${config.user.profile.max_num_tags}）`)
		}
		profile.tags = params.tags
	}

	query.profile = profile

	const result = await collection.updateOne({ "_id": params.user_id }, {
		"$set": query
	})
	return true
}