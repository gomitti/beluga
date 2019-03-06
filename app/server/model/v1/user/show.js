import config from "../../../config/beluga"
import memcached from "../../../memcached"

export default async (db, params) => {
    params = Object.assign({
        "trim_profile": true,
    }, params)

    const user = await memcached.v1.user.show(db, { "id": params.id, "name": params.name })
    if (user === null) {
        return null
    }

    if (!!user.profile === false && params.trim_profile === false) {
        user.profile = {
            "location": "",
            "description": "",
            "theme_color": config.user.profile.default_theme_color,
            "tags": []
        }
    }
    if (!!user.display_name === false) {
        user.display_name = ""
    }
    if (params.trim_profile === true) {
        delete user.profile
    }
    if (params.community_id) {
        user.role = await memcached.v1.user.role.get(db, { "user_id": params.id, "community_id": params.community_id })
    }
    return user
}