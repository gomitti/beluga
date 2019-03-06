import memcached from "../../../memcached"

export default async (db, params) => {
    const user_ids = await memcached.v1.community.members(db, { "community_id": params.community_id })
    const users = []
    for (let j = 0; j < user_ids.length; j++) {
        const user_id = user_ids[j]
        const user = await memcached.v1.user.show(db, { "id": user_id })
        if (user) {
            user.role = await memcached.v1.user.role.get(db, { "user_id": user.id, "community_id": params.community_id })
            users.push(user)
        }
    }
    return users
}