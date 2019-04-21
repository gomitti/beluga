import api from "../../../../api"
import { Memcached } from "../../../../memcached/v1/memcached"

const memcached = new Memcached(api.v1.statuses.popular.favorite)

const register_flush_func = target => {
    target.flush = () => {
        memcached.delete()
    }
    return target
}

export default register_flush_func(async (db, params) => {
    return await memcached.fetch("status_ids", db, params)
})