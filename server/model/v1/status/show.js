import memcached from "../../../memcached"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    params = Object.assign({
        "trim_favorited_by": true,
    }, params)

    const status = await memcached.v1.status.show(db, { "id": params.id })
    if (status === null) {
        return null
    }

    status.reactions = await memcached.v1.reaction.show(db, { "status_id": params.id })

    status.favorited_by = []
    if (status.favorites_count > 0 && params.trim_favorited_by === false) {
        const user_ids = await memcached.v1.favorite.favorited_by(db, { "status_id": status.id })
        for (const user_id of user_ids) {
            const user = await memcached.v1.user.show(db, { "id": user_id })
            if (user) {
                status.favorited_by.push(user)
            }
        }
    }

    if (params.user_id) {
        try {
            const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")
            if (status.favorites_count === 0) {
                status.favorited = false
            } else {
                status.favorited = await memcached.v1.favorite.favorited(db, {
                    user_id,
                    "status_id": status.id
                })
            }
        } catch (error) {

        }
    }

    return status
}