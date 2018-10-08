import memcached from "../../../memcached"
import { try_convert_to_object_id } from "../../../lib/object_id"
import { is_object } from "../../../assert";

export default async (db, params) => {
    params = Object.assign({
        "trim_favorited_by": true,
        "trim_commenters": true,
    }, params)

    const status = await memcached.v1.status.show(db, { "id": params.id })
    if (status === null) {
        return null
    }

    status.reactions = await memcached.v1.reaction.show(db, { "status_id": params.id })

    status.favorited_by = []
    if (status.favorites_count > 0 && params.trim_favorited_by === false) {
        const user_ids = await memcached.v1.favorite.favorited_by(db, { "status_id": status.id })
        for (let i = 0; i < user_ids.length; i++) {
            const user_id = user_ids[i]
            const user = await memcached.v1.user.show(db, { "id": user_id })
            if (user) {
                status.favorited_by.push(user)
            }
        }
    }

    status.commenters = []
    if (status.comments_count > 0 && status.commenter_ids && params.trim_commenters === false) {
        for (let i = 0; i < status.commenter_ids.length; i++) {
            const user_id = status.commenter_ids[i]
            const user = await memcached.v1.user.show(db, { "id": user_id })
            if (user) {
                status.commenters.push(user)
            }
        }
    }

    if (params.requested_by) {
        if (status.favorites_count === 0) {
            status.favorited = false
        } else {
            status.favorited = await memcached.v1.favorite.favorited(db, {
                "user_id": params.requested_by,
                "status_id": status.id
            })
        }
    }

    if (is_object(status.entities) === false) {
        status.entities = {}
    }

    return status
}