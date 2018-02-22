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

	if (data.length === 0) {
		throw new Error("不正なファイルです")
	}
	if (data.length > config.user.profile.background_image.max_filesize) {
		throw new Error(`ファイルサイズが大きすぎます（${data.length} > ${config.user.profile.background_image.max_filesize}）`)
	}
	
	const type = fileType(data)
	if (!type) {
		throw new Error("このファイル形式には対応していません")
	}
	if (type.ext !== "jpg" && type.ext !== "png") {
		throw new Error("このファイル形式には対応していません")
	}

	const shape = await gm_filesize(data)
	if (shape.width == 0) {
		throw new Error("不正な画像です")
	}
	if (shape.height == 0) {
		throw new Error("不正な画像です")
	}
	if (shape.width > config.user.profile.background_image.max_size) {
		throw new Error(`画像の幅が大きすぎます（${shape.width} > ${config.user.profile.background_image.max_size}）`)
	}
	if (shape.height > config.user.profile.background_image.max_size) {
		throw new Error(`画像の高さが大きすぎます（${shape.height} > ${config.user.profile.background_image.max_size}）`)
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
	}, user.profile)
	profile.use_background_image = true
	profile.background_image = url

	await collection.updateOne({ "_id": params.user_id }, {
		"$set": { profile }
	})

	await db.collection("background_images").insertOne({
		"user_id": user_id,
		"host": storage.host,
		directory,
		filename,
		"created_at": Date.now()
	})

	return true
}