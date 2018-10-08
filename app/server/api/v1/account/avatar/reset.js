import config from "../../../../config/beluga"
import update from "./update"
import assert from "../../../../assert"
import { gm_draw } from "../../../../lib/gm"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const { storage } = params
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    const size = config.user.profile.image_size
    const colors = config.colors
    let random_color = colors[Math.floor(Math.random() * colors.length)]
    if (random_color.indexOf("#") !== 0) {
        random_color = "#" + random_color
    }
    if (!!random_color.match(/^#[0-9A-Fa-f]+$/) === false) {
        throw new Error("サーバーで問題が発生しました")
    }

    const data = await gm_draw(size, size, random_color)
    return update(db, {
        data,
        storage,
        user_id,
    })
}