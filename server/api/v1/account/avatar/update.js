import { ObjectID } from "mongodb"
import config from "../../../../config/beluga"
import logger from "../../../../logger"
const fileType = require("file-type")
const path = require("path")
const Ftp = require("jsftp")
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

const ftp_put = async (ftp, data, directory) => {
	return new Promise((resolve, reject) => {
		ftp.put(data, directory, error => {
			if (error) {
				reject(error)
			}
			resolve()
		})
	})
}

const gm_filesize = async (data) => {
	return new Promise((resolve, reject) => {
		gm(data).size(function (error, size) {
			if (error) {
				return reject(error)
			}
			return resolve(size)
		})
	})
}

const gm_resize = async (data, width, height) => {
	return new Promise((resolve, reject) => {
		gm(data)
			.resize(width, height)
			.toBuffer(function (error, data) {
				if (error) {
					return reject(error)
				}
				return resolve(data)
			})
	})
}

const gm_crop = async (data, width, height, x, y) => {
	return new Promise((resolve, reject) => {
		gm(data)
			.crop(width, height, x, y)
			.toBuffer(function (error, data) {
				if (error) {
					return reject(error)
				}
				return resolve(data)
			})
	})
}

export default async (db, data, user, storage) => {
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}
	if (!(user.id instanceof ObjectID)) {
		throw new Error("ユーザーが見つかりません")
	}

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
	directory = path.join(directory, user.id.toHexString())
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
			user,
		})
		throw new Error("サーバーで問題が発生しました")
	}

	const protocol = storage.https ? "https" : "http"
	const url = `${protocol}://${storage.url_prefix}.${storage.domain}/${directory}/${filename}`

	let collection = db.collection("users")
	let result = await collection.update({ "_id": user.id }, {
		"$set": { "avatar_url": url }
	})

	collection = db.collection("profile_images")
	result = await collection.insertOne({
		"user_id": user.id,
		"host": storage.host,
		directory,
		filename,
		"created_at": Date.now()
	})

	return url
}