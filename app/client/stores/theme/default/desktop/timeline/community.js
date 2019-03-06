import TimelineStore from "./index"

export default class Store extends TimelineStore {
    constructor(request_query, params, options) {
        super("/timeline/community", request_query, params, options)
    }
    statusBelongsTo(status) {
        const { community } = this.params
        if (status.community_id === community.id) {
            return true
        }
        return false
    }
}