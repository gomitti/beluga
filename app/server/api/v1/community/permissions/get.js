import constants from "../../../../constants"
import { try_convert_to_object_id } from "../../../../lib/object_id"
import { is_bool } from "../../../../assert"

const generate_default_permissions = () => {
    const perms = {
        [constants.community.permission.create_channel]: true,
        [constants.community.permission.add_emoji]: true,
    }
    return perms
}

export default async (db, params) => {
    const community_id = try_convert_to_object_id(params.community_id, "$community_idが不正です")

    const permissions = {
        [constants.role.admin]: generate_default_permissions(),
        [constants.role.moderator]: generate_default_permissions(),
        [constants.role.member]: generate_default_permissions(),
        [constants.role.guest]: generate_default_permissions(),
    }

    const docs = await db.collection("community_permissions").find({ community_id }).toArray()
    if (docs === null) {
        return permissions
    }
    const perm = constants.community.permission
    docs.forEach(doc => {
        const default_perms = permissions[doc.role]
        permissions[doc.role] = {
            [perm.create_channel]: is_bool(doc[perm.create_channel]) ? doc[perm.create_channel] : default_perms[perm.create_channel],
            [perm.add_emoji]: is_bool(doc[perm.add_emoji]) ? doc[perm.add_emoji] : default_perms[perm.add_emoji],
        }
    })
    return permissions
}