import config from "../../../../config/beluga"
import logger from "../../../../logger"
import assert, { is_string, is_number } from "../../../../assert"
import { ftp_mkdir, ftp_put } from "../../../../lib/ftp"
import { gm_coalesce, gm_crop, gm_noprofile, gm_shape, gm_resize } from "../../../../lib/gm"
import fileType from "file-type"
import path from "path"
import Ftp from "jsftp"
import { sync as uid } from "uid-safe"
import { try_convert_to_object_id } from "../../../../lib/object_id"

const gm_convert = async original_data => {
    assert(original_data instanceof Buffer, "不正なデータです")

    if (original_data.length > config.media.image.max_filesize) {
        throw new Error("ファイルサイズが大きすぎます")
    }
    if (original_data.length === 0) {
        throw new Error("ファイルサイズが不正です")
    }

    const type = fileType(original_data)
    if (!!type === false) {
        throw new Error("このファイル形式には対応していません")
    }
    if (type.ext !== "jpg" && type.ext !== "png" && type.ext !== "gif") {
        throw new Error("このファイル形式には対応していません")
    }

    if (type.ext !== "gif") {
        original_data = await gm_noprofile(original_data)	// Exifを消す
    }

    // gifの静止画
    let coalesce_data = null
    if (type.ext === "gif") {
        coalesce_data = await gm_coalesce(original_data)
    }

    // 縦横のサイズを取得
    const original_shape = await gm_shape(type.ext === "gif" ? coalesce_data : original_data)
    const max_size = Math.max(original_shape.width, original_shape.height)
    const min_size = Math.min(original_shape.width, original_shape.height)
    if (original_shape.width == 0 || original_shape.height == 0) {
        throw new Error("画像サイズが不正です")
    }

    // 正方形のサムネイル
    let square_data = type.ext === "gif" ? coalesce_data : original_data
    let base_size = config.media.image.thumbnail.square_size
    if (min_size > base_size) {
        // リサイズの必要がある場合
        const ratio = base_size / min_size
        const new_width = original_shape.width * ratio
        const new_height = original_shape.height * ratio
        square_data = await gm_resize(square_data, new_width, new_height)
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
            square_data = await gm_crop(square_data, base_size, base_size, x, 0)
        } else {
            base_size = original_shape.width
            const y = parseInt((original_shape.height - base_size) / 2.0)
            square_data = await gm_crop(square_data, base_size, base_size, 0, y)
        }
    }

    // 中間のサイズ
    let medium_data = null
    base_size = config.media.image.thumbnail.medium_size
    if (max_size > base_size && type.ext !== "gif") {		// gifは重いので作らない
        const ratio = base_size / max_size
        const new_width = original_shape.width * ratio
        const new_height = original_shape.height * ratio
        medium_data = await gm_resize(original_data, new_width, new_height)
    }

    // 小さいサイズ
    let small_data = null
    base_size = config.media.image.thumbnail.small_size
    if (max_size > base_size) {
        const ratio = base_size / max_size
        const new_width = original_shape.width * ratio
        const new_height = original_shape.height * ratio
        small_data = await gm_resize(medium_data ? medium_data : original_data, new_width, new_height)
    }

    let total_bytes = original_data.length + square_data.length
    if (medium_data) {
        total_bytes += medium_data.length
    }
    if (small_data) {
        total_bytes += small_data.length
    }
    if (coalesce_data) {
        total_bytes += coalesce_data.length
    }

    return {
        original_shape,
        original_data,
        square_data,
        medium_data,
        small_data,
        coalesce_data,
        type,
        total_bytes
    }
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
        throw new Error("サーバーで問題が発生しました")
    }
    return directory
}

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")
    const { storage } = params
    assert(typeof storage === "object", "不正なコミュニティです")

    const {
        original_shape,
        original_data,
        square_data,
        medium_data,
        small_data,
        coalesce_data,
        type,
        total_bytes } = await gm_convert(params.data)

    const ftp = new Ftp({
        "host": storage.host,
        "port": storage.port,
        "user": storage.user,
        "pass": storage.password
    })

    const directory = await try_ftp_mkdir(ftp)

    const prefix = `${original_shape.width}-${original_shape.height}`
    const original_filename = `${prefix}.${type.ext}`
    const square_filename = `${prefix}.square.${type.ext}`
    const medium_filename = `${prefix}.medium.${type.ext}`
    const small_filename = `${prefix}.small.${type.ext}`
    const coalesce_filename = `${prefix}.coalesce.png`

    try {
        await ftp_put(ftp, original_data, path.join(directory, original_filename))
        await ftp_put(ftp, square_data, path.join(directory, square_filename))
        if (medium_data) {
            await ftp_put(ftp, medium_data, path.join(directory, medium_filename))
        }
        if (small_data) {
            await ftp_put(ftp, small_data, path.join(directory, small_filename))
        }
        if (coalesce_data) {
            await ftp_put(ftp, coalesce_data, path.join(directory, coalesce_filename))
        }
    } catch (error) {
        logger.log({
            "level": "error",
            "error": error.toString(),
            "directory": directory,
            "user_id": user_id,
        })
        throw new Error("サーバーで問題が発生しました")
    }

    const collection = db.collection("media")
    const result = await collection.insertOne({
        directory,
        user_id,
        prefix,
        "host": storage.host,
        "is_image": true,
        "extension": type.ext,
        "bytes": total_bytes,
        "created_at": Date.now()
    })

    const protocol = storage.https ? "https" : "http"
    const base_url = `${protocol}://${storage.url_prefix}.${storage.domain}`

    return {
        "original": `${base_url}/${path.join(directory, original_filename)}`,
        "square": `${base_url}/${path.join(directory, square_filename)}`,
        "small": `${base_url}/${path.join(directory, small_filename)}`,
        "medium": `${base_url}/${path.join(directory, medium_filename)}`,
    }
}