import model from "../../../model"
import assert from "../../../assert"

export default async (db, params) => {
    const rows = await model.v1.media.list(db, params)
    assert(Array.isArray(rows), "$rows must be of type array")

    const list = []
    for (let j = 0; j < rows.length; j++) {
        const row = rows[j]
        const media = await model.v1.media.show(db, { "id": row.id })
        if (media) {
            list.push(media)
        }
    }
    return list
}