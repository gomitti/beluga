import config from "../../../../config/beluga"
import constants from "../../../../constants"
import logger from "../../../../logger"
import assert, { is_string, is_number, is_bool, is_object } from "../../../../assert"
import { try_convert_to_object_id } from "../../../../lib/object_id"
import assign from "../../../../lib/assign"

const is_valid_permission = perm => {
    if (perm === constants.community.permission.create_channel) {
        return true
    }
    if (perm === constants.community.permission.add_emoji) {
        return true
    }
    return false
}

const is_valid_role = role => {
    if (role === constants.role.admin) {
        return true
    }
    if (role === constants.role.moderator) {
        return true
    }
    if (role === constants.role.member) {
        return true
    }
    if (role === constants.role.guest) {
        return true
    }
    return false
}

const generate_default_permissions = () => {
    const perms = {
        [constants.community.permission.create_channel]: true,
        [constants.community.permission.add_emoji]: true,
    }
    return perms
}

const assign_permission_for_role = (existing_role_permissions, default_role_permissions, role_to_assign) => {
    if (is_object(existing_role_permissions) === false) {
        return default_role_permissions
    }
    if (existing_role_permissions.role === role_to_assign) {
        const permissions = {}
        Object.keys(default_role_permissions).forEach(permission => {
            if (permission in existing_role_permissions) {
                permissions[permission] = existing_role_permissions[permission]
            } else {
                permissions[permission] = default_role_permissions[permission]
            }

        })
        return permissions
    }
    return default_role_permissions
}

export default async (db, params) => {
    const community_id = try_convert_to_object_id(params.community_id, "$community_idが不正です")
    const { role, permission, allowed } = params
    assert(is_number(role), "$roleが不正です")
    assert(is_string(permission), "$permissionが不正です")
    assert(is_bool(allowed), "$allowedが不正です")

    if (is_valid_permission(permission) === false) {
        throw new Error("不正なpermissionです")
    }

    if (is_valid_role(role) === false) {
        throw new Error("不正なroleです")
    }

    const default_role_permissions = generate_default_permissions()
    const collection = db.collection("community_permissions")
    const existing_permissions = await collection.findOne({ "community_id": community_id, "role": role })
    
    const new_role_permissions = assign_permission_for_role(existing_permissions, default_role_permissions, role)
    new_role_permissions[permission] = allowed

    const result = await collection.updateOne({ "community_id": community_id, "role": role }, {
        "$set": new_role_permissions
    }, { "upsert": true })

    return true
}