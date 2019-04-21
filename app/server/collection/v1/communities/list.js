import memcached from "../../../memcached"
import model from "../../../model"
import assert from "../../../assert"

export default async (db, params) => {
    const community_ids = await memcached.v1.communities.list(db, params)
    if (community_ids.length == 0) {
        return []
    }

    const communities = []
    for (let j = 0; j < community_ids.length; j++) {
        const community_id = community_ids[j]
        const community = await model.v1.community.show(db, { "id": community_id })
        if (community === null) {
            continue
        }
        communities.push(community)
    }
    return communities
}