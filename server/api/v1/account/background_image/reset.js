import config from "../../../../config/beluga"
import assert from "../../../../assert"
import assign from "../../../../lib/assign"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const { storage } = params
    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")

    const collection = db.collection("users")
    const user = await collection.findOne({ "_id": user_id })
    assert(user, "ユーザーが存在しません")

    if (!!user.profile === false) {
        user.profile = {}
    }

    const profile = assign(
        {
            "location": "",
            "description": "",
            "theme_color": config.user.profile.default_theme_color,
            "tags": []
        },
        user.profile,
        {
            "use_background_image": false,
            "background_image": null,
        })

    await collection.updateOne({ "_id": user_id }, {
        "$set": { profile }
    })

    return true
}