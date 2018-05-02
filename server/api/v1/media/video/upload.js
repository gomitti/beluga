import config from "../../../../config/beluga"
import logger from "../../../../logger"
import assert, { is_string, is_number } from "../../../../assert"
import { gm_crop, gm_resize } from "../../../../lib/gm"
import { ftp_mkdir, ftp_put } from "../../../../lib/ftp"
import { ff_metadata, ff_screenshot } from "../../../../lib/ffmpeg"
import path from "path"
import Ftp from "jsftp"
import { sync as uid } from "uid-safe"
import fs from "fs"
import { try_convert_to_object_id } from "../../../../lib/object_id"

const get_extension = format_name => {
    if (format_name.indexOf("mp4") !== -1) {
        return "mp4"
    }
    if (format_name.indexOf("webm") !== -1) {
        return "webm"
    }
    return null
}

const reject = (metadata, video_filepath, message) => {
    logger.log({
        "level": "error",
        metadata
    })
    try {
        fs.unlinkSync(video_filepath)
    } catch (error) {
        logger.log({
            "level": "error",
            "error": error.toString()
        })
    }
    throw new Error(message ? message : "サーバーで問題が発生しました")
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

const verify_data = async video_filepath => {
    const metadata = await ff_metadata(video_filepath)

    // ファイルチェック
    if (!!metadata === false) {
        reject(null, video_filepath, "動画の情報を取得できません")
    }
    if (!!metadata.streams === false) {
        reject(metadata, video_filepath, "動画を読み込めません")
    }

    // 拡張子のチェック
    const { format } = metadata
    const ext = get_extension(format.format_name)
    if (ext === null) {
        reject(metadata, video_filepath, "このファイル形式には対応していません")
    }
    if (!(config.media.video.allowed_file_types.includes(ext))) {
        reject(metadata, video_filepath, `このファイル形式には対応していません（${ext}）`)
    }

    const { video, audio } = extract_streams(metadata.streams)
    if (video === null) {
        reject(metadata, video_filepath, "動画ではありません")
    }
    if (config.media.video.unsupported_codecs.includes(video.codec_long_name)) {
        reject(metadata, video_filepath, `このファイル形式には対応していません（${video.codec_long_name}）`)
    }

    const { width, height } = video
    if (typeof width !== "number" && typeof height !== "number") {
        reject(metadata, video_filepath)
    }
    if (width === 0 || height === 0) {
        reject(metadata, video_filepath, `サイズが不正です（${width}x${height}）`)
    }
    if (width > config.media.video.max_width || height > config.media.video.max_height) {
        reject(metadata, video_filepath, `サイズが大きすぎます（${width}x${height} > ${config.media.video.max_width}x${config.media.video.max_height}）`)
    }
    return {
        width,
        height,
        ext
    }
}

const delete_tmp_file = filepath => {
    try {
        fs.unlinkSync(filepath)
    } catch (error) {
        logger.log({
            "level": "error",
            "error": error.toString()
        })
        throw new Error(error.toString())
    }
}

const write_video = (filepath, data) => {
    try {
        fs.writeFileSync(filepath, data)
    } catch (error) {
        logger.log({
            "level": "error",
            "error": error.toString()
        })
        throw new Error(error.toString())
    }
}

const read_poster_data = filepath => {
    try {
        return fs.readFileSync(filepath)
    } catch (error) {
        logger.log({
            "level": "error",
            "error": error.toString()
        })
    }
    return null
}

const gm_crop_poster = async (poster_data, width, height) => {
    const min_size = Math.min(width, height)

    let square_data = null
    let base_size = config.media.image.thumbnail.square_size	// 画像に合わせる
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

    if (!!square_data === false) {
        logger.log({
            "level": "error",
            "error": "square_data is null",
            metadata
        })
        throw new Error("サムネイルを作成できません")
    }

    return square_data
}

const try_ftp_mkdir = async ftp => {
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
        throw new Error(error.toString())
    }
    return directory
}

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")
    let original_data = params.data
    const { storage } = params
    assert(original_data instanceof Buffer, "不正なデータです")
    assert(typeof storage === "object", "不正なサーバーです")

    if (original_data.length === 0) {
        throw new Error("ファイルサイズが不正です")
    }
    if (original_data.length > config.media.video.max_filesize) {
        throw new Error("ファイルサイズが大きすぎます")
    }

    // 一時的にファイルに書き込み
    const tmp_video_filepath = path.join(config.tmp.directory, uid(24))
    write_video(tmp_video_filepath, original_data)

    // 検証
    const { width, height, ext } = await verify_data(tmp_video_filepath)

    // 静止画
    const tmp_poster_filename = uid(24) + ".jpg"
    const tmp_poster_filepath = path.join(config.tmp.directory, tmp_poster_filename)
    await ff_screenshot(tmp_video_filepath, tmp_poster_filename, config.tmp.directory)

    // 動画の一時ファイルを削除
    delete_tmp_file(tmp_video_filepath)
    // 静止画を読み込み
    const poster_data = read_poster_data(tmp_poster_filepath)
    // 静止画の一時ファイルを削除
    delete_tmp_file(tmp_poster_filepath)

    if (!!poster_data === false) {
        throw new Error("サムネイルを作成できません")
    }

    // サムネイルを作成
    const square_data = await gm_crop_poster(poster_data, width, height)

    const ftp = new Ftp({
        "host": storage.host,
        "port": storage.port,
        "user": storage.user,
        "pass": storage.password
    })


    const directory = await try_ftp_mkdir(ftp)
    const total_bytes = original_data.length + poster_data.length + square_data.length

    const prefix = `${width}-${height}`
    const video_filename = `${prefix}.${ext}`
    const poster_filename = `${prefix}.poster.jpg`
    const square_filename = `${prefix}.square.jpg`

    try {
        await ftp_put(ftp, original_data, path.join(directory, video_filename))
        await ftp_put(ftp, poster_data, path.join(directory, poster_filename))
        await ftp_put(ftp, square_data, path.join(directory, square_filename))
    } catch (error) {
        logger.log({
            "level": "error",
            "error": error.toString(),
            directory,
            user_id,
        })
        throw new Error(error.toString())
    }

    const collection = db.collection("media")
    const result = await collection.insertOne({
        user_id,
        directory,
        prefix,
        "host": storage.host,
        "is_video": true,
        "extension": ext,
        "bytes": total_bytes,
        "created_at": Date.now()
    })

    const protocol = storage.https ? "https" : "http"
    const base_url = `${protocol}://${storage.url_prefix}.${storage.domain}`

    return {
        "original": `${base_url}/${path.join(directory, video_filename)}`,
    }
}