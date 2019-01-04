import model from "../../../../../model"
import assert from "../../../../../assert"

export default async (db, params) => {
    const rows = await model.v1.account.pin.media.list(db, params)
    assert(Array.isArray(rows), "$rows must be of type array")

    const list = []
    for (let j = 0; j < rows.length; j++) {
        const id = rows[j]
        const media = await model.v1.media.show(db, { id })
        if (media) {
            list.push(media)
        }
    }
    return list
}