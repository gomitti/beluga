import { ObjectID } from "mongodb"
import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string } from "../../../assert"
import { try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.access_token.show)

const register_flush_func = target => {
    target.flush = token => {
        token = try_convert_to_hex_string(token, "$tokenが不正です")
        memcached.delete(token)
    }
    return target
}

export default register_flush_func(async (db, params) => {
    const token = try_convert_to_hex_string(params.token, "$tokenを指定してください")
    return await memcached.fetch(token, db, params)
})