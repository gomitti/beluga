import { ObjectID } from "mongodb"
import config from "../../../../config/beluga"
import logger from "../../../../logger"
import { gm_crop, gm_resize } from "../image/upload"
const fileType = require("file-type")
const ffmpeg = require("fluent-ffmpeg")
const ffprobe = require("node-ffprobe")
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

const ff_metadata = async filepath => {
	return new Promise((resolve, reject) => {
		ffprobe(filepath, function (error, probeData) {
			if (error) {
				return reject(error)
			}
			return resolve(probeData)
		})
	})
}

const ff_screenshot = async (video_filepath, poster_filename, directory) => {
	return new Promise((resolve, reject) => {
		ffmpeg(video_filepath)
			.on("end", function () {
				resolve()
			})
			.screenshots({
				count: 1,
				folder: directory,
				filename: poster_filename,
			})
	})
}

const get_extension = format_name => {
	if (format_name.indexOf("mp4") !== -1) {
		return "mp4"
	}
	return null
}

const reject = metadata => {
	logger.log({
		"level": "error",
		metadata
	})
	throw new Error("サーバーで問題が発生しました")
}

const extract_streams = streams => {
	if (streams.length === 1) {
		const video = streams[0]
		const audio = null
		if (video.codec_type === "video") {
			return { video, audio }
		}
		return { "video": null, audio }
	}
	let video = streams[0]
	let audio = streams[1]
	if (video.codec_type === "video" && audio.codec_type === "audio") {
		return { video, audio }
	}
	video = streams[1]
	audio = streams[0]
	if (video.codec_type === "video" && audio.codec_type === "audio") {
		return { video, audio }
	}
	return { "video": null, "audio": null }
}

export default async (db, original_data, user, server) => {
	if (!(user.id instanceof ObjectID)) {
		throw new Error()
	}
	if (original_data.length > config.media.video.max.filesize) {
		throw new Error("ファイルサイズが大きすぎます")
	}

	const type = fileType(original_data)
	if (!type) {
		throw new Error("このファイル形式には対応していません")
	}
	if (!(config.media.video.allowed_file_types.includes(type.ext.toLowerCase()))) {
		throw new Error("このファイル形式には対応していません")
	}

	const video_filepath = path.join(config.tmp.directory, uid(24))
	try {
		fs.writeFileSync(video_filepath, original_data)
	} catch (error) {
		logger.log({
			"level": "error",
			"error": error.toString()
		})
		throw new Error("サーバーで問題が発生しました")
	}

	const tmp_poster_filename = uid(24) + ".jpg"
	const tmp_poster_filepath = path.join(config.tmp.directory, tmp_poster_filename)
	await ff_screenshot(video_filepath, tmp_poster_filename, config.tmp.directory)

	// 静止画
	let poster_data = null
	try {
		poster_data = fs.readFileSync(tmp_poster_filepath)
	} catch (error) {
		logger.log({
			"level": "error",
			"error": error.toString()
		})
		throw new Error("サーバーで問題が発生しました")
	}
	if (!poster_data) {
		throw new Error("サーバーで問題が発生しました")
	}

	const metadata = await ff_metadata(video_filepath)

	try {
		fs.unlinkSync(video_filepath)
	} catch (error) {
		logger.log({
			"level": "error",
			"error": error.toString()
		})
		throw new Error("サーバーで問題が発生しました")
	}

	try {
		fs.unlinkSync(tmp_poster_filepath)
	} catch (error) {
		logger.log({
			"level": "error",
			"error": error.toString()
		})
		throw new Error("サーバーで問題が発生しました")
	}

	if (!metadata) {
		throw new Error("サーバーで問題が発生しました")
	}
	if (!metadata.streams) {
		reject(metadata)
	}

	const { video, audio } = extract_streams(metadata.streams)
	if (video === null) {
		reject(metadata)
	}

	const { width, height } = video
	if (typeof width !== "number" && typeof height !== "number") {
		reject(metadata)
	}
	if (width === 0 || height === 0) {
		throw new Error(`サイズが不正です（${width}x${height}）`)
	}
	if (width > config.media.video.max.width || height > config.media.video.max.height) {
		throw new Error(`サイズが大きすぎます（${width}x${height} > ${config.media.video.max.width}x${config.media.video.max.height}）`)
	}

	const min_size = Math.min(width, height)

	let square_data = null
	let base_size = config.media.image.thumbnail.square.size	// 画像に合わせる
	if (min_size > base_size) {
		// リサイズの必要がある場合
		const ratio = base_size / min_size
		const new_width = width * ratio
		const new_height = height * ratio
		square_data = await gm_resize(poster_data, new_width, new_height)
		if (width >= height) {
			const x = parseInt((new_width - base_size) / 2.0)
			square_data = await gm_crop(square_data, base_size, base_size, x, 0)
		} else {
			const y = parseInt((new_height - base_size) / 2.0)
			square_data = await gm_crop(square_data, base_size, base_size, 0, y)
		}
	} else {
		// リサイズ不要の場合
		if (width >= height) {
			base_size = height
			const x = parseInt((width - base_size) / 2.0)
			square_data = await gm_crop(poster_data, base_size, base_size, x, 0)
		} else {
			base_size = width
			const y = parseInt((height - base_size) / 2.0)
			square_data = await gm_crop(poster_data, base_size, base_size, 0, y)
		}
	}

	if (!square_data) {
		logger.log({
			"level": "error",
			"error": "square_data is null",
			metadata
		})
		throw new Error("サーバーで問題が発生しました")
	}

	// もう一度拡張子のチェック
	const { format } = metadata
	const ext = get_extension(format.format_name)
	if (ext === null) {
		throw new Error("このファイル形式には対応していません")
	}
	if (!(config.media.video.allowed_file_types.includes(ext))) {
		throw new Error("このファイル形式には対応していません")
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

	const total_bytes = original_data.length + poster_data.length + square_data.length

	const suffix = `${width}-${height}`
	const video_filename = `${suffix}.${ext}`
	const poster_filename = `${suffix}.poster.jpg`
	const square_filename = `${suffix}.square.jpg`

	try {
		await ftp_put(ftp, original_data, path.join(directory, video_filename))
		await ftp_put(ftp, poster_data, path.join(directory, poster_filename))
		await ftp_put(ftp, square_data, path.join(directory, square_filename))
	} catch (error) {
		logger.log({
			"level": "error",
			"error": error.toString(),
			directory,
			user,
			metadata
		})
		throw new Error("サーバーで問題が発生しました")
	}

	const collection = db.collection("media")
	const result = await collection.insertOne({
		"user_id": user.id,
		"host": server.host,
		directory,
		suffix,
		"is_video": true,
		"extension": ext,
		"bytes": total_bytes,
		"created_at": Date.now()
	})

	const protocol = server.https ? "https" : "http"
	const base_url = `${protocol}://${server.url_prefix}.${server.domain}`

	return {
		"original": `${base_url}/${path.join(directory, video_filename)}`,
	}
}