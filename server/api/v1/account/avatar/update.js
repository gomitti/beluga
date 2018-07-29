import config from "../../../../config/beluga"
import logger from "../../../../logger"
import assert, { is_string, is_number } from "../../../../assert"
import { ftp_mkdir, ftp_put } from "../../../../lib/ftp"
import { gm_filesize, gm_resize } from "../../../../lib/gm"
import { try_convert_to_object_id } from "../../../../lib/object_id"
import fileType from "file-type"
import path from "path"
import Ftp from "jsftp"
import { sync as uid } from "uid-safe"
import fs from "fs"

const verify_type = data => {
    assert(data instanceof Buffer, "@data must be an instance of Buffer")
    const type = fileType(data)
    if (!!type === false) {
        throw new Error("このファイル形式には対応していません")
    }
    if (type.ext !== "jpg" && type.ext !== "png") {
        throw new Error("このファイル形式には対応していません")
    }
    return type
}

const verify_shape = async data => {
    const shape = await gm_filesize(data)
    if (shape.width !== shape.height) {
        throw new Error("画像が正方形ではありません")
    }
    if (shape.width == 0) {
        throw new Error("画像が正方形ではありません")
    }
    return shape
}

const try_ftp_mkdir = async (ftp, user_id) => {
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
    return directory
}

export default async (db, params) => {
    const { storage } = params
    assert(typeof storage === "object", "@storage must be of type object")
    assert(is_string(storage.host), "@storage.host must be of type string")
    assert(is_number(storage.port), "@storage.port must be of type number")
    assert(is_string(storage.user), "@storage.user must be of type string")
    assert(is_string(storage.password), "@storage.password must be of type string")

    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")

    let { data } = params
    const type = verify_type(data)
    const shape = await verify_shape(data)

    if (shape.width > config.user.profile.image_size) {
        data = await gm_resize(data, config.user.profile.image_size, config.user.profile.image_size)
    }

    const ftp = new Ftp({
        "host": storage.host,
        "port": storage.port,
        "user": storage.user,
        "pass": storage.password
    })

    const directory = await try_ftp_mkdir(ftp, user_id)

    const filename = uid(8) + "." + type.ext
    try {
        await ftp_put(ftp, data, path.join(directory, filename))
    } catch (error) {
        logger.log({
            "level": "error",
            "error": error.toString(),
            "directory": directory,
            "user_id": user_id,
        })
        throw new Error("サーバーで問題が発生しました")
    }

    const protocol = storage.https ? "https" : "http"
    const url = `${protocol}://${storage.url_prefix}.${storage.domain}/${directory}/${filename}`

    await db.collection("users").update({ "_id": user_id }, {
        "$set": { "avatar_url": url }
    })

    await db.collection("avatar_images").insertOne({
        "host": storage.host,
        "created_at": Date.now(),
        user_id,
        directory,
        filename,
    })

    return url
}