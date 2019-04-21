import { ObjectID } from "mongodb"
import assert, { is_string } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    await db.collection("access_tokens").remove({
        "user_id": user_id,
    })
    await db.collection("account_pins").remove({
        "user_id": user_id,
    })
    await db.collection("avatar_images").remove({
        "user_id": user_id,
    })
    await db.collection("channel_members").remove({
        "user_id": user_id,
    })
    await db.collection("channels").remove({
        "created_by": user_id,
    })
    await db.collection("communities").remove({
        "created_by": user_id,
    })
    await db.collection("community_members").remove({
        "user_id": user_id,
    })
    await db.collection("emojis").remove({
        "added_by": user_id,
    })
    await db.collection("favorites").remove({
        "user_id": user_id,
    })
    await db.collection("kvs").remove({
        "user_id": user_id,
    })
    await db.collection("likes").remove({
        "user_id": user_id,
    })
    await db.collection("media").remove({
        "user_id": user_id,
    })
    await db.collection("muted_users").remove({
        "requested_by": user_id,
    })
    await db.collection("muted_users").remove({
        "user_id_to_mute": user_id,
    })
    await db.collection("muted_words").remove({
        "user_id": user_id,
    })
    await db.collection("notifications").remove({
        "user_id": user_id,
    })
    await db.collection("password").remove({
        "user_id": user_id,
    })
    await db.collection("reactions").remove({
        "user_id": user_id,
    })
    await db.collection("sessions").remove({
        "user_id": user_id,
    })
    await db.collection("statuses").remove({
        "user_id": user_id,
    })
    await db.collection("user_role").remove({
        "user_id": user_id,
    })
    await db.collection("users").remove({
        "_id": user_id,
    })

    return true
}