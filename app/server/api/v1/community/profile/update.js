import config from "../../../../config/beluga"
import logger from "../../../../logger"
import assert, { is_string } from "../../../../assert"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const community_id = try_convert_to_object_id(params.community_id, "$community_idが不正です")

    const collection = db.collection("communities")
    const community = await collection.findOne({ "_id": community_id })
    assert(community, "コミュニティが存在しません")

    const query = {}
    const { display_name, description } = params

    if (is_string(display_name)) {
        if (display_name.length > config.community.max_display_name_length) {
            throw new Error(`コミュニティ名を${config.community.max_display_name_length}文字以内で入力してください。（${display_name.length} > ${config.community.max_display_name_length}）`)
        }
        query.display_name = display_name
    }

    if (is_string(description)) {
        if (description.length > config.community.max_description_length) {
            throw new Error(`概要を${config.community.max_description_length}文字以内で入力してください。（${description.length} > ${config.community.max_description_length}）`)
        }
        query.description = description
    }


    const result = await collection.updateOne({ "_id": community_id }, {
        "$set": query
    })
    return true
}