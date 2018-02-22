import { ObjectID } from "mongodb"
import config from "../../../../config/beluga"
import logger from "../../../../logger"
import assert, { is_string, is_number } from "../../../../assert"
import { ftp_mkdir, ftp_put } from "../../../../lib/ftp"
import { gm_filesize, gm_resize } from "../../../../lib/gm"
import fileType from "file-type"
import path from "path"
import Ftp from "jsftp"
import { sync as uid } from "uid-safe"
import fs from "fs"

export default async (db, params) => {
	const { storage } = params
	let { data, user_id } = params

	if (typeof user_id === "string") {
		try {
			user_id = ObjectID(user_id)
		} catch (error) {
			throw new Error("不正なユーザーです")
		}
	}
	assert(user_id instanceof ObjectID, "不正なユーザーです")
	assert(data instanceof Buffer, "不正なデータです")
	assert(typeof storage === "object", "不正なサーバーです")

	const type = fileType(data)
	if (!type) {
		throw new Error("このファイル形式には対応していません")
	}
	if (type.ext !== "jpg" && type.ext !== "png") {
		throw new Error("このファイル形式には対応していません")
	}

	const shape = await gm_filesize(data)
	if (shape.width !== shape.height) {
		throw new Error("画像が正方形ではありません")
	}
	if (shape.width == 0) {
		throw new Error("画像が正方形ではありません")
	}

	if (shape.width > config.user.profile.image_size) {
		data = await gm_resize(data, config.user.profile.image_size, config.user.profile.image_size)
	}

	assert(is_string(storage.host), "@storage.host must be string")
	assert(is_number(storage.port), "@storage.port must be number")
	assert(is_string(storage.user), "@storage.user must be string")
	assert(is_string(storage.password), "@storage.password must be string")

	const ftp = new Ftp({
		"host": storage.host,
		"port": storage.port,
		"user": storage.user,
		"pass": storage.password
	})
	let directory = "profile"
	try {
		await ftp_mkdir(ftp, directory)
	} catch (error) {

	}
	directory = path.join(directory, "avatar")
	try {
		await ftp_mkdir(ftp, directory)
	} catch (error) {

	}
	directory = path.join(directory, user_id.toHexString())
	try {
		await ftp_mkdir(ftp, directory)
	} catch (error) {
		
	}

	let filename = uid(8) + "." + type.ext
	try {
		await ftp_put(ftp, data, path.join(directory, filename))
	} catch (error) {
		logger.log({
			"level": "error",
			"error": error.toString(),
			directory,
			user_id,
		})
		throw new Error("サーバーで問題が発生しました")
	}

	const protocol = storage.https ? "https" : "http"
	const url = `${protocol}://${storage.url_prefix}.${storage.domain}/${directory}/${filename}`

	await db.collection("users").update({ "_id": user_id }, {
		"$set": { "avatar_url": url }
	})

	await db.collection("avatar_images").insertOne({
		"user_id": user_id,
		"host": storage.host,
		directory,
		filename,
		"created_at": Date.now()
	})

	return url
}