import { ObjectID } from "mongodb"
import config from "../../../../config/beluga"
import logger from "../../../../logger"
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

export default async (db, params, server, storage) => {
	if (!server) {
		throw new Error("サーバーが見つかりません")
	}
	if (!(server.id instanceof ObjectID)) {
		throw new Error("サーバーが見つかりません")
	}

	let data = params.data
	const shape = await gm_filesize(data)
	if (shape.width !== shape.height) {
		throw new Error("画像が正方形ではありません")
	}

	if (shape.width > config.server.profile.image_size) {
		// data = await gm_resize(data, config.server.profile.image_size, config.server.profile.image_size)
	}

	const ftp = new Ftp({
		"host": storage.host,
		"port": storage.port,
		"user": storage.user,
		"pass": storage.password
	})
	let directory = "server"
	try {
		await ftp_mkdir(ftp, directory)
	} catch (error) {

	}
	directory = path.join(directory, "avatar")
	try {
		await ftp_mkdir(ftp, directory)
	} catch (error) {

	}
	directory = path.join(directory, server.id.toHexString())
	try {
		await ftp_mkdir(ftp, directory)
	} catch (error) {

	}

	let filename = uid(8) + "." + params.ext
	try {
		await ftp_put(ftp, data, path.join(directory, filename))
	} catch (error) {
		logger.log({
			"level": "error",
			"error": error.toString(),
			directory,
			server,
		})
		throw new Error("サーバーで問題が発生しました")
	}

	const protocol = storage.https ? "https" : "http"
	const url = `${protocol}://${storage.url_prefix}.${storage.domain}/${directory}/${filename}`

	let collection = db.collection("servers")
	let result = await collection.update({ "_id": server.id }, {
		"$set": { "avatar_url": url }
	})

	collection = db.collection("server_images")
	result = await collection.insertOne({
		"server_id": server.id,
		"host": storage.host,
		directory,
		filename,
		"created_at": Date.now()
	})

	return url
}