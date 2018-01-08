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

const gm_draw = async (output_filename, width, height, color_code) => {
	return new Promise((resolve, reject) => {
		gm(width, height, color_code)
			.write(output_filename, function (error) {
				if (error) {
					return reject(error)
				}
				return resolve()
			})
	})
}

export default async (db, user, server) => {
	if (!(user.id instanceof ObjectID)) {
		throw new Error()
	}

	const tmp_dirname = path.join(config.tmp.path, "tmp")
	const tmp_filename = path.join(tmp_dirname, uid(30))
	try {
		fs.mkdirSync(tmp_dirname)
	} catch (error) {

	}
	if (fs.existsSync(tmp_filename)){
		throw new Error("サーバーで問題が発生しました。やり直してください。")
	}
	const base_size = config.profile.image.size
	const color = "#88F"
	await gm_draw(tmp_filename, base_size, base_size, color)

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