import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const rows = await db.collection("users").find({}).sort({ "name": 1 }).toArray()
    rows.forEach(user => {
        user.id = user._id
        for (const key in user) {
            if (key.indexOf("_") == 0) {
                delete user[key]
            }
        }
    })
    return rows
}