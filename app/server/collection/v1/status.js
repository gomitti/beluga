import show from "./status/show"

const default_params = {
    "trim_user": true,
    "trim_community": true,
    "trim_channel": true,
    "trim_recipient": true,
    "trim_favorited_by": true,
    "trim_reaction_users": true,
    "trim_commenters": true,
}

export default { show, default_params }