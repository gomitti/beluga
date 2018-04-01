import config from "../../config/beluga"
import assert, { is_array, is_object, is_string } from "../../assert"
import assign from "../../lib/assign"

export class Memcached {
    // @max_age 秒
    constructor(fn, max_age) {
        this.cache = {}
        this.fn = fn
        this.max_age = max_age || config.memcached.max_age
    }
    delete_recursively(keys) {
        assert(is_array(keys), "@keys must be of type array")
        let root = this.cache
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i]
            if (key in root) {
                root = root[key]
            } else {
                return false
            }
        }
        const key = keys[keys.length - 1]
        if (key in root) {
            delete root[key]
            return true
        }
        return false
    }
    delete(key) {
        if (is_string(key)) {
            return this.delete_recursively([key])
        }
        if (is_array(key)) {
            return this.delete_recursively(key)
        }
        assert(false, "@keyが不正です")
    }
    fetch_recursively(keys) {
        assert(is_array(keys), "@keys must be of type array")
        let root = this.cache
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i]
            if (key in root) {
                root = root[key]
            } else {
                return null
            }
        }
        const key = keys[keys.length - 1]
        if (key in root) {
            return root[key]
        }
        return null
    }
    clear_if_needed_recursively(keys) {
        let root = this.cache
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i]
            if (key in root) {
                root = root[key]
            } else {
                return
            }
            if (Object.keys(root).length > config.memcached.capacity) {
                root = {}
            }
        }
    }
    store_recursively(keys, data) {
        assert(is_array(keys), "@keys must be of type array")
        let root = this.cache
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i]
            if (key in root) {
                root = root[key]
            } else {
                root[key] = {}
                root = root[key]
            }
        }
        const key = keys[keys.length - 1]
        root[key] = {
            "expires": Date.now() + this.max_age * 1000,	// Date.now()はミリ秒
            "hit": 0,
            data
        }
    }
    async fetch(keys, db, params) {
        if (is_string(keys)) {
            keys = [keys]
        }
        assert(is_array(keys), "@keys must be of type array")

        const obj = this.fetch_recursively(keys)
        if (obj) {
            const { data, expires } = obj
            if (expires > Date.now()) {
                obj.hit += 1
                if (is_array(data)) {
                    return data
                }
                if (is_object(obj)) {
                    return assign(data)	// コピーを送る
                }
                return data
            }
            this.delete_recursively(keys)
        }

        const data = await this.fn(db, params)
        if (data === null) {
            return null
        }

        this.clear_if_needed_recursively(keys)
        this.store_recursively(keys, data)

        if (is_array(data)) {
            return data
        }
        if (is_object(data)) {
            return assign(data)	// コピーを送る
        }
        return data
    }
}