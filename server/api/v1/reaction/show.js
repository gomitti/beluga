import { try_convert_to_object_id } from "../../../lib/object_id"

export default async (db, params) => {
    const status_id = try_convert_to_object_id(params.status_id, "@status_idが不正です")

    const collection = db.collection("reactions")
    const rows = await collection.find({ status_id }).sort({ "created_at": 1 }).toArray()
    if (rows === null) {
        return []
    }
    const map_shortname_count = {}
    const sorted_shortnames = []
    for (const row of rows) {
        const { shortname } = row
        if (!!(shortname in map_shortname_count) === false) {
            sorted_shortnames.push(shortname)
            map_shortname_count[shortname] = 1
            continue
        }
        map_shortname_count[shortname] += 1
    }
    const ret = []
    for (const shortname of sorted_shortnames) {
        const count = map_shortname_count[shortname]
        ret.push({
            shortname, count
        })
    }
    return ret
}