import { ObjectID } from "mongodb"
import config from "../../../../config/beluga"
import update from "./update"
import path from "path"
import Ftp from "jsftp"
import assert from "../../../../assert"
import { gm_draw } from "../../../../lib/gm"

export default async (db, params) => {
	let { user_id } = params
	if (typeof user_id === "string") {
		try {
			user_id = ObjectID(user_id)
		} catch (error) {
			throw new Error("不正なユーザーです")
		}
	}
	assert(user_id instanceof ObjectID, "不正なユーザーです")

	const size = config.user.profile.image_size
	const colors = config.colors
	let random_color = colors[Math.floor(Math.random() * colors.length)]
	if (random_color.indexOf("#") !== 0) {
		random_color = "#" + random_color
	}
	if (!random_color.match(/^#[0-9A-Fa-f]+$/)) {
		throw new Error("サーバーで問題が発生しました")
	}
	const data = await gm_draw(size, size, random_color)
	return update(db, {
		"user_id": user_id,
		"storage": params.storage,
		data
	})
}