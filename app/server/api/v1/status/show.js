import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const id = try_convert_to_object_id(params.id, "$idが不正です")

    const collection = db.collection("statuses")
    const status = await collection.findOne({ "_id": id })
    if (status === null) {
        return null
    }
    status.id = status._id
    for (const key in status) {
        if (key.indexOf("_") == 0) {
            delete status[key]
        }
    }

    // コメントタイムラインに自分自身を出すためにハックしているので
    // ここで無効化しておく
    // 詳細はmodel/v1/status/update.jsを参照
    if (status.id.equals(status.in_reply_to_status_id)) {
        status.in_reply_to_status_id = null
    }

    return status
}