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

const gm_noprofile = async (data) => {
	return new Promise((resolve, reject) => {
		gm(data)
			.noProfile()
			.toBuffer(function (error, data) {
				if (error) {
					return reject(error)
				}
				return resolve(data)
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

export default async (db, original_data, params, user, server) => {
	if (!(user.id instanceof ObjectID)) {
		throw new Error()
	}

	original_data = await gm_noprofile(original_data)	// Exifを消す
	const original_shape = await gm_filesize(original_data)
	const max_size = Math.max(original_shape.width, original_shape.height)
	const min_size = Math.min(original_shape.width, original_shape.height)

	// 正方形のサムネイル
	let square_data = null
	let base_size = config.media.image.thumbnail.square.size
	if (min_size > base_size) {
		// リサイズの必要がある場合
		const ratio = base_size / min_size
		const new_width = original_shape.width * ratio
		const new_height = original_shape.height * ratio
		square_data = await gm_resize(original_data, new_width, new_height)
		if (original_shape.width >= original_shape.height) {
			const x = parseInt((new_width - base_size) / 2.0)
			square_data = await gm_crop(square_data, base_size, base_size, x, 0)
		} else {
			const y = parseInt((new_height - base_size) / 2.0)
			square_data = await gm_crop(square_data, base_size, base_size, 0, y)
		}
	} else {
		// リサイズ不要の場合
		if (original_shape.width >= original_shape.height) {
			base_size = original_shape.height
			const x = parseInt((original_shape.width - base_size) / 2.0)
			square_data = await gm_crop(original_data, base_size, base_size, x, 0)
		} else {
			base_size = original_shape.width
			const y = parseInt((original_shape.height - base_size) / 2.0)
			square_data = await gm_crop(original_data, base_size, base_size, 0, y)
		}
	}

	// 中間のサイズ
	let medium_data = null
	base_size = config.media.image.thumbnail.medium.size
	if (min_size > base_size) {
		const ratio = base_size / min_size
		const new_width = original_shape.width * ratio
		const new_height = original_shape.height * ratio
		medium_data = await gm_resize(original_data, new_width, new_height)
	}

	// 小さいサイズ
	let small_data = null
	base_size = config.media.image.thumbnail.small.size
	if (min_size > base_size) {
		const ratio = base_size / min_size
		const new_width = original_shape.width * ratio
		const new_height = original_shape.height * ratio
		small_data = await gm_resize(medium_data ? medium_data : original_data, new_width, new_height)
	}

	const ftp = new Ftp({
		"host": server.host,
		"port": server.port,
		"user": server.user,
		"pass": server.password
	})
	let directory = "media"
	try {
		await ftp_mkdir(ftp, directory)
	} catch (error) {
	}
	directory = path.join(directory, uid(24))
	try {
		await ftp_mkdir(ftp, directory)
	} catch (error) {
		logger.log({
			"level": "error",
			"error": error.toString()
		})
		throw new Error("サーバーで問題が発生しました")
	}

	const suffix = `${original_shape.width}-${original_shape.height}`
	let original_filename = `${suffix}.${params.ext}`
	let square_filename = `${suffix}.square.${params.ext}`
	let medium_filename = `${suffix}.medium.${params.ext}`
	let small_filename = `${suffix}.small.${params.ext}`

	try {
		await ftp_put(ftp, original_data, path.join(directory, original_filename))
		await ftp_put(ftp, square_data, path.join(directory, square_filename))
		if (medium_data) {
			await ftp_put(ftp, medium_data, path.join(directory, medium_filename))
		}
		if (small_data) {
			await ftp_put(ftp, small_data, path.join(directory, small_filename))
		}
	} catch (error) {
		logger.log({
			"level": "error",
			"error": error.toString(),
			directory,
			user,
		})
		throw new Error("サーバーで問題が発生しました")
	}

	const collection = db.collection("media")
	const result = await collection.insertOne({
		"user_id": user.id,
		"host": server.host,
		"directory": directory,
		"size": original_data.length,
		"created_at": Date.now()
	})

	const protocol = server.https ? "https" : "http"
	const base_url = `${protocol}://${server.url_prefix}.${server.domain}`

	return {
		"original": `${base_url}/${path.join(directory, original_filename)}`,
		"square": `${base_url}/${path.join(directory, square_filename)}`,
		"small": `${base_url}/${path.join(directory, small_filename)}`,
		"medium": `${base_url}/${path.join(directory, medium_filename)}`,
	}
}