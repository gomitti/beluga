import config from "../../../config/beluga"
import logger from "../../../logger"
import assert, { is_string, is_bool } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"
import assign from "../../../lib/assign"

export default async (db, params) => {
    const channel_id = try_convert_to_object_id(params.channel_id, "$channel_idが不正です")

    const collection = db.collection("channels")
    const channel = await collection.findOne({ "_id": channel_id })
    assert(channel, "チャンネルが存在しません")

    const { name } = params
    const query = {}

    if (is_string(name)) {
        if (name.length > config.channel.max_name_length) {
            throw new Error(`チャンネル名を${config.channel.max_name_length}文字以内で入力してください。（${name.length} > ${config.channel.max_name_length}）`)
        }
        query.name = name
    }

    try {
        await collection.updateOne({ "_id": channel_id }, {
            "$set": query
        })
    } catch (error) {
        throw error
    }
    return true
}