import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert from "../../../assert"
import { try_convert_to_hex_string } from "../../../lib/object_id"

const memcached = new Memcached(api.v1.communities.list)

const register_flush_func = target => {
    target.flush = () => {
        memcached.delete("list")
    }
    return target
}

export default register_flush_func(async (db, params) => {
    return await memcached.fetch("list", db, params)
})