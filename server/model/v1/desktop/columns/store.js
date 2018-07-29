import api from "../../../../api"
import memcached from "../../../../memcached"
import assert, { is_string, is_array, is_object } from "../../../../assert"
import assign from "../../../../lib/assign"
import { try_convert_to_object_id } from "../../../../lib/object_id";

const should_store_column = async (db, param_ids, available_param_ids) => {
    for (const key in param_ids) {
        if (!!available_param_ids.includes(key) == false) {
            throw new Error("@keyが不正です")
        }
        const id = param_ids[key]
        if (key === "hashtag_id") {
            const hashtag = await memcached.v1.hashtag.show(db, { id })
            if (hashtag === null) {
                return false
            }
        }
        if (key === "server_id") {
            const server = await memcached.v1.server.show(db, { id })
            if (server === null) {
                return false
            }
        }
        if (key === "user_id") {
            const user = await memcached.v1.user.show(db, { id })
            if (user === null) {
                return false
            }
        }
    }
    return true
}

export default async (db, params) => {
    const { columns, pathname } = params
    assert(is_array(columns), "@columns must be of type array")

    const user = await memcached.v1.user.show(db, { "id": params.user_id })
    assert(user !== null, "ユーザーが見つかりません")

    const available_param_ids = ["hashtag_id", "server_id", "user_id"]
    const available_types = ["home", "hashtag", "server"]
    const columns_to_store = []

    for (const column of columns) {
        assert(is_object(column), "@column must be of type object")

        const { param_ids, type } = column
        assert(is_string(type), "@pathname must be of type string")

        if (!!available_types.includes(type) == false) {
            throw new Error("@typeが不正です")
        }

        if (Object.keys(param_ids) == 0) {
            throw new Error("@request_queryが不正です")
        }
        assert(is_object(param_ids), "@param_ids must be of type object")

        if (await should_store_column(db, param_ids, available_param_ids) === false) {
            continue
        }
        columns_to_store.push({ param_ids, type })
    }

    await api.v1.desktop.columns.store(db, { "user_id": user.id, "columns": columns_to_store, "pathname": pathname })

    // キャッシュの消去
    memcached.v1.delete_desktop_columns_from_cache(user.id, pathname)

    return true
}