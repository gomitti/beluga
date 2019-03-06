import api from "../../../api"
import { Memcached } from "../../../memcached/v1/memcached"
import assert, { is_string, is_number } from "../../../assert"
import { try_convert_to_hex_string, convert_to_hex_string_or_null } from "../../../lib/object_id"

const fetch_func = api.v1.timeline.notifications

// since_id指定時と分ける
const memcached_diff = new Memcached(fetch_func)
const memcached_all = new Memcached(fetch_func)

const register_flush_func = target => {
    target.flush = user_id => {
        user_id = try_convert_to_hex_string(user_id, "$user_idが不正です")
        memcached_diff.delete(user_id)
        memcached_all.delete(user_id)
    }
    return target
}

const fetch_all = async (db, params) => {
    const user_id = try_convert_to_hex_string(params.user_id, "$user_idを指定してください")
    const { count, type } = params
    assert(is_number(count), "$count must be of type number")
    if (type) {
        assert(is_number(type), "$type must be of type number")
    }

    const since_id = convert_to_hex_string_or_null(params.since_id)
    const max_id = convert_to_hex_string_or_null(params.max_id)
    if (since_id === null && max_id === null) {
        if (type) {
            return await memcached_all.fetch([user_id, type, count], db, params)
        }
        return await memcached_all.fetch([user_id, count], db, params)
    }

    if (max_id) {
        // キャッシュする必要はない
        return await fetch(db, params)
    }
    if (type) {
        return await memcached_diff.fetch([user_id, type, since_id, count], db, params)
    }
    return await memcached_diff.fetch([user_id, since_id, count], db, params)
}

const fetch_specified_community = async (db, params) => {
    const user_id = try_convert_to_hex_string(params.user_id, "$recipient_idを指定してください")
    const community_id = try_convert_to_hex_string(params.community_id, "$community_idを指定してください")
    const { count, type } = params
    assert(is_number(count), "$count must be of type number")
    if (type) {
        assert(is_number(type), "$type must be of type number")
    }

    const since_id = convert_to_hex_string_or_null(params.since_id)
    const max_id = convert_to_hex_string_or_null(params.max_id)
    if (since_id === null && max_id === null) {
        if (type) {
            return await memcached_all.fetch([user_id, community_id, type, count], db, params)
        }
        return await memcached_all.fetch([user_id, community_id, count], db, params)
    }

    if (max_id) {
        // キャッシュする必要はない
        return await fetch_func(db, params)
    }
    if (type) {
        return await memcached_diff.fetch([user_id, community_id, type, since_id, count], db, params)
    }
    return await memcached_diff.fetch([user_id, community_id, since_id, count], db, params)
}

export default register_flush_func(async (db, params) => {
    if (params.community_id) {
        return await fetch_specified_community(db, params)
    } else {
        return await fetch_all(db, params)
    }
})