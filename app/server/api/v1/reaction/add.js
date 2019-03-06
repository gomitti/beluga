import config from "../../../config/beluga"
import { try_convert_to_object_id } from "../../../lib/object_id"
import { is_string } from "../../../assert"

const compute_order = (reactions, shortname_to_add) => {
    for (let j = 0; j < reactions.length; j++) {
        const reaction = reactions[j]
        if (shortname_to_add === reaction.shortname) {
            return reaction.order
        }
    }
    return reactions.length
}

export default async (db, params) => {
    const user_id = try_convert_to_object_id(params.user_id, "$user_idが不正です")
    const status_id = try_convert_to_object_id(params.status_id, "$status_idが不正です")

    const { shortname } = params
    if (is_string(shortname) === false) {
        throw new Error("追加するリアクションを指定してください")
    }
    if (!!shortname.match(/[a-zA-Z0-9_\-+]+/) === false) {
        throw new Error("追加するリアクションを指定してください")
    }

    const collection = db.collection("reactions")

    const count = await collection.find({ user_id, status_id }).count()
    if (count >= config.status.reaction.limit) {
        throw new Error("これ以上リアクションを追加することはできません")
    }

    const already_added = await collection.findOne({ user_id, status_id, shortname })
    if (already_added) {
        throw new Error("同じリアクションを追加することはできません")
    }

    const all_reactions = await collection.aggregate([
        {
            "$match": { status_id }
        },
        {
            "$group": {
                "_id": "$shortname",
                "shortname": { "$first": "$shortname" },
                "order": { "$first": "$order" },
            }
        },
    ]).toArray()
    const order = compute_order(all_reactions, shortname)

    const reaction = {
        user_id,
        status_id,
        shortname,
        order,
        "created_at": Date.now()
    }
    const result = await collection.insertOne(reaction)
    return reaction
}