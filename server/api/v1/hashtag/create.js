import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"
import { is_string } from "../../../assert"

export default async (db, params) => {
    const { tagname } = params
    if (is_string(tagname) === false) {
        throw new Error("ハッシュタグを指定してください")
    }
    if (tagname.length > config.hashtag.max_tagname_length) {
        throw new Error(`ハッシュタグは${config.hashtag.max_tagname_length}文字を超えてはいけません`)
    }

    const user_id = try_convert_to_object_id(params.user_id, "@user_idが不正です")
    const server_id = try_convert_to_object_id(params.server_id, "@server_idが不正です")

    const collection = db.collection("hashtags")

    const existing = await collection.findOne({ tagname, server_id })
    if (existing !== null) {
        throw new Error(`#${tagname}はすでに存在するため、違うハッシュタグに変更してください`)
    }

    const result = await collection.insertOne({
        server_id,
        tagname,
        "is_public": true,
        "description": "",
        "statuses_count": 0,
        "created_at": Date.now(),
        "created_by": params.user_id
    })
    const hashtag = result.ops[0]
    hashtag.id = hashtag._id
    delete hashtag._id
    return hashtag
}