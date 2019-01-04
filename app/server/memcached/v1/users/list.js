import api from "../../../api"
import assert, { is_string } from "../../../assert"
import { try_convert_to_hex_string } from "../../../lib/object_id"

let cached_users = null

const register_flush_func = target => {
    target.flush = () => {
        cached_users = null
    }
    return target
}

export default register_flush_func(async (db, params) => {
    if (cached_users === null) {
        cached_users = await api.v1.users.list(db, {})
    }
    return cached_users
})