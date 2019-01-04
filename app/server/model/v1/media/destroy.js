import api from "../../../api"
import memcached from "../../../memcached"
import storage from "../../../config/storage"
import Ftp from "jsftp"
import path from "path"
import { is_string, is_array } from "../../../assert"
import { ftp_ls, ftp_delete, ftp_rmd } from "../../../lib/ftp"
import assert from "../../../assert"

const map_host_storage = {}
storage.servers.forEach(server => {
    map_host_storage[server.host] = server
})

const delete_remote_files = async (ftp, item) => {
    const files = await ftp_ls(ftp, item.directory)
    assert(is_array(files), "$files must be of type array")
    for (let j = 0; j < files.length; j++) {
        const file = files[j]
        const filepath = path.join(item.directory, file.name)
        await ftp_delete(ftp, filepath)
    }
    await ftp_rmd(ftp, item.directory)
}

export default async (db, params) => {
    const media = await memcached.v1.media.show(db, { "id": params.id })
    assert(media !== null, "ファイルが見つかりません")

    const { host } = media
    assert(is_string(host), "$host must be of type string")

    const remote = map_host_storage[host]
    assert(!!remote, "$remote must be of type objcet")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")
    assert(media.user_id.equals(user.id), "$権限がありません")

    await api.v1.media.destroy(db, { "id": params.id })

    const favorites = await api.v1.account.pin.media.list(db, { "user_id": user.id })
    const new_favorites = []
    favorites.forEach(id => {
        if (id.equals(media.id)) {
            return
        }
        new_favorites.push(id)
    })
    await api.v1.account.pin.media.update(db, { "user_id": user.id, "media_ids": new_favorites })

    const ftp = new Ftp({
        "host": remote.host,
        "port": remote.port,
        "user": remote.user,
        "pass": remote.password
    })
    await delete_remote_files(ftp, media)

    // キャッシュの消去
    memcached.v1.media.show.flush(media.id)
    memcached.v1.media.list.flush(user.id)
    memcached.v1.media.aggregate.flush(user.id)
    memcached.v1.account.pin.media.list.flush(user.id)

    return true
}