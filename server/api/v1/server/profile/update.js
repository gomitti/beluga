import config from "../../../../config/beluga"
import logger from "../../../../logger"
import assert, { is_string } from "../../../../assert"
import { try_convert_to_object_id } from "../../../../lib/object_id"

export default async (db, params) => {
    const server_id = try_convert_to_object_id(params.server_id, "@server_idが不正です")

    const collection = db.collection("servers")
    const server = await collection.findOne({ "_id": server_id })
    assert(server, "サーバーが存在しません")

    const query = {}
    const { display_name, description } = params

    if (is_string(display_name)) {
        if (display_name.length > config.server.max_display_name_length) {
            throw new Error(`サーバー名を${config.server.max_display_name_length}文字以内で入力してください。（${display_name.length} > ${config.server.max_display_name_length}）`)
        }
        query.display_name = display_name
    }

    if (is_string(description)) {
        if (description.length > config.server.max_description_length) {
            throw new Error(`概要を${config.server.max_description_length}文字以内で入力してください。（${description.length} > ${config.server.max_description_length}）`)
        }
        query.description = description
    }


    const result = await collection.updateOne({ "_id": server_id }, {
        "$set": query
    })
    return true
}