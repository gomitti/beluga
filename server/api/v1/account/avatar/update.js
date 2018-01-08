import { ObjectID } from "mongodb"
import config from "../../../../config/beluga"
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

const gm_filesize = async (filename) => {
	return new Promise((resolve, reject) => {
		gm(filename).size(function (error, size) {
			if (error) {
				return reject(error)
			}
			return resolve(size)
		})
	})
}

const gm_resize = async (input_path, output_path, width, height) => {
	return new Promise((resolve, reject) => {
		gm(input_path)
			.resize(width, height)
			.write(output_path, function (error) {
				if (error) {
					return reject(error)
				}
				return resolve()
			})
	})
}

const gm_crop = async (input_path, output_path, width, height, x, y) => {
	return new Promise((resolve, reject) => {
		gm(input_path)
			.crop(width, height, x, y)
			.write(output_path, function (error) {
				if (error) {
					return reject(error)
				}
				return resolve()
			})
	})
}

export default async (db, original_path, params, user, server) => {
	if (!(user.id instanceof ObjectID)) {
		throw new Error()
	}

	console.log(original_path)
	const original_shape = await gm_filesize(original_path)
	const max_size = Math.max(original_shape.width, original_shape.height)
	const min_size = Math.min(original_shape.width, original_shape.height)
	console.log(original_shape)

	const base_size = config.profile.image.size
	if (min_size > base_size) {
		// リサイズの必要がある場合
		const ratio = base_size / min_size
		const new_width = original_shape.width * ratio
		const new_height = original_shape.height * ratio
		await gm_resize(original_path, original_path, new_width, new_height)
		if (original_shape.width >= original_shape.height) {
			const x = parseInt((new_width - base_size) / 2.0)
			await gm_crop(original_path, original_path, base_size, base_size, x, 0)
		} else {
			const y = parseInt((new_height - base_size) / 2.0)
			await gm_crop(original_path, original_path, base_size, base_size, 0, y)
		}
	} else {
		// リサイズ不要の場合
		if (original_shape.width >= original_shape.height) {
			let base_size = original_shape.height
			const x = parseInt((original_shape.width - base_size) / 2.0)
			await gm_crop(original_path, original_path, base_size, base_size, x, 0)
		} else {
			let base_size = original_shape.width
			const y = parseInt((original_shape.height - base_size) / 2.0)
			await gm_crop(original_path, original_path, base_size, base_size, 0, y)
		}
	}
	return


	const ftp = new Ftp({
		host: server.host,
		port: server.port,
		user: server.user,
		pass: server.password
	})
	let directory = "media"
	try {
		await ftp_mkdir(ftp, directory)
	} catch (error) {
		console.log(error)
	}
	directory = path.join(directory, uid(20))
	console.log(directory)
	try {
		await ftp_mkdir(ftp, directory)
	} catch (error) {
		console.error(error);
	}
	await ftp.raw("quit")
	return true
}