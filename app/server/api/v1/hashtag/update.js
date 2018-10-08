import config from "../../../config/beluga"
import logger from "../../../logger"
import assert, { is_string, is_bool } from "../../../assert"
import { try_convert_to_object_id } from "../../../lib/object_id"
import assign from "../../../lib/assign"

export default async (db, params) => {
    const hashtag_id = try_convert_to_object_id(params.hashtag_id, "$hashtag_idが不正です")

    const collection = db.collection("hashtags")
    const hashtag = await collection.findOne({ "_id": hashtag_id })
    assert(hashtag, "ルームが存在しません")

    const query = {}
    const { tagname, is_public } = assign(params, {
        "is_public": true
    })

    if (is_string(tagname)) {
        if (tagname.length > config.hashtag.max_tagname_length) {
            throw new Error(`ルーム名を${config.hashtag.max_tagname_length}文字以内で入力してください。（${tagname.length} > ${config.hashtag.max_tagname_length}）`)
        }
        query.tagname = tagname
    }

    if (is_bool(is_public)) {
        query.is_public = is_public
    }


    const result = await collection.updateOne({ "_id": hashtag_id }, {
        "$set": query
    })
    return true
}