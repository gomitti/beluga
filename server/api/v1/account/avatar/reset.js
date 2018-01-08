import { ObjectID } from "mongodb"
import config from "../../../../config/beluga"
import update from "./update"
import path from "path"
import Ftp from "jsftp"
const uid = require("uid-safe").sync
const fs = require("fs")
const gm = require("gm")

const ftp_mkdir = async (ftp, directory) => {
	return new Promise((resolve, reject) => {
		ftp.raw("mkd", directory, (error, data) => {
			if (error) {
				return reject(error)
			}
			return resolve(data)
		})
	})
}

const gm_draw = async (width, height, color_code) => {
	return new Promise((resolve, reject) => {
		gm(width, height, color_code)
			.toBuffer("PNG", function (error, data) {
				if (error) {
					return reject(error)
				}
				return resolve(data)
			})
	})
}

export default async (db, user, server) => {
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}
	if (!(user.id instanceof ObjectID)) {
		throw new Error("ユーザーが見つかりません")
	}

	const size = config.profile.image.size
	const colors = config.profile.image.default.colors
	let random_color = colors[Math.floor(Math.random() * colors.length)]
	if (random_color.indexOf("#") !== 0) {
		random_color = "#" + random_color
	}
	if (!!random_color.match(/^#[0-9A-Fa-f]+$/) === false) {
		throw new Error("サーバーで問題が発生しました")
	}
	const data = await gm_draw(size, size, random_color)
	return update(db, { data, "ext": "png" }, user, server)
}