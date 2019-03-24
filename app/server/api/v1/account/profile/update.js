import config from "../../../../config/beluga"
import logger from "../../../../logger"
import assert, { is_string } from "../../../../assert"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")

    const collection = db.collection("users")
    const user = await collection.findOne({ "_id": user_id })
    assert(user, "ユーザーが存在しません")

    if (!!user.profile === false) {
        user.profile = {}
    }

    const query = {
        "profile": Object.assign({
            "location": "",
            "description": "",
            "theme_color": config.user.profile.default_theme_color,
            "use_background_image": false,
            "status_emoji_shortname": null,
            "status_text": null,
            "tags": []
        }, user.profile)
    }

    const { display_name, theme_color, description, location, tags, status_text, status_emoji_shortname } = params

    if (is_string(display_name)) {
        if (display_name.length > config.user.max_display_name_length) {
            throw new Error(`ユーザー名を${config.user.max_display_name_length}文字以内で入力してください。（${display_name.length} > ${config.user.max_display_name_length}）`)
        }
        query.display_name = display_name
    }

    if (is_string(theme_color)) {
        if (theme_color.match(/#[0-9a-fA-F]{6}/) || theme_color.match(/#[0-9a-fA-F]{3}/)) {
            query.profile.theme_color = theme_color.toLowerCase()
        }
    }

    if (is_string(description)) {
        if (description.length > config.user.profile.max_description_length) {
            throw new Error(`自己紹介を${config.user.profile.max_description_length}文字以内で入力してください。（${description.length} > ${config.user.profile.max_description_length}）`)
        }
        query.profile.description = description
    }

    if (is_string(location)) {
        if (location.length > config.user.profile.max_location_length) {
            throw new Error(`現在位置を${config.user.profile.max_location_length}文字以内で入力してください。（${location.length} > ${config.user.profile.max_location_length}）`)
        }
        query.profile.location = location
    }

    if (is_string(status_emoji_shortname) && status_emoji_shortname.length > 0) {
        if (status_emoji_shortname.length > config.emoji.max_shortname_length) {
            throw new Error(`ステータスの絵文字コードを${config.emoji.max_shortname_length}文字以内で入力してください。（${status_emoji_shortname.length} > ${config.emoji.max_shortname_length}）`)
        }
        query.profile.status_emoji_shortname = status_emoji_shortname

        // 絵文字がない場合ステータスのテキストは設定されない
        if (is_string(status_text)) {
            if (status_text.length > config.user.max_status_text_length) {
                throw new Error(`ステータスを${config.user.max_status_text_length}文字以内で入力してください。（${status_text.length} > ${config.user.max_status_text_length}）`)
            }
            query.profile.status_text = status_text
        }
    }


    if (Array.isArray(tags)) {
        tags.forEach(tag => {
            if (is_string(tag) === false) {
                throw new Error("不正なタグが含まれています")
            }
            if (tag.length === 0) {
                throw new Error("文字数が0のタグが含まれています")
            }
            if (tag.length >= config.user.profile.max_tag_length) {
                throw new Error(`タグの文字数は${config.user.profile.max_tag_length}までです。（${tag.length} > ${config.user.profile.max_tag_length}）`)
            }
        })
        if (tags.length > config.user.profile.max_num_tags) {
            throw new Error(`タグの個数は${config.user.profile.max_num_tags}までです。（${tags.length} > ${config.user.profile.max_num_tags}）`)
        }
        query.profile.tags = tags
    }

    const result = await collection.updateOne({ "_id": user_id }, {
        "$set": query
    })
    return true
}