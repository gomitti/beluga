import memcached from "../../../memcached"

export default async (db, params) => {
    const user_ids = await memcached.v1.channel.members(db, { "id": params.id })
    const users = []
    for (let j = 0; j < user_ids.length; j++) {
        const user_id = user_ids[j]
        const user = await memcached.v1.user.show(db, { "id": user_id })
        if (user) {
            users.push(user)
        }
    }
    return users
}