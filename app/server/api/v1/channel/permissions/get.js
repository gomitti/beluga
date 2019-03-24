import config from "../../../../config/beluga"
import constants from "../../../../constants"
import { try_convert_to_object_id } from "../../../../lib/object_id"
import { is_bool } from "../../../../assert"

const generate_default_permissions = () => {
    const perms = {
        [constants.channel.permission.update_status]: true,
        [constants.channel.permission.like_status]: true,
        [constants.channel.permission.favorite_status]: true,
        [constants.channel.permission.comment_on_status]: true,
        [constants.channel.permission.add_reaction_to_status]: true,
    }
    return perms
}

export default async (db, params) => {
    const channel_id = try_convert_to_object_id(params.channel_id, "$channel_idが不正です")

    const permissions = {
        [constants.role.admin]: generate_default_permissions(),
        [constants.role.moderator]: generate_default_permissions(),
        [constants.role.member]: generate_default_permissions(),
        [constants.role.guest]: generate_default_permissions(),
    }

    const docs = await db.collection("channel_permissions").find({ channel_id }).toArray()
    if (docs === null) {
        return permissions
    }
    const perm = constants.channel.permission
    docs.forEach(doc => {
        const default_perms = permissions[doc.role]
        permissions[doc.role] = {
            [perm.update_status]: is_bool(doc[perm.update_status]) ? doc[perm.update_status] : default_perms[perm.update_status],
            [perm.like_status]: is_bool(doc[perm.like_status]) ? doc[perm.like_status] : default_perms[perm.like_status],
            [perm.favorite_status]: is_bool(doc[perm.favorite_status]) ? doc[perm.favorite_status] : default_perms[perm.favorite_status],
            [perm.comment_on_status]: is_bool(doc[perm.comment_on_status]) ? doc[perm.comment_on_status] : default_perms[perm.comment_on_status],
            [perm.add_reaction_to_status]: is_bool(doc[perm.add_reaction_to_status]) ? doc[perm.add_reaction_to_status] : default_perms[perm.add_reaction_to_status],
        }
    })
    return permissions
}