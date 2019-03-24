import TimelineStore from "./index"

export default class Store extends TimelineStore {
    constructor(request_query, params, options, logged_in_user) {
        super("/timeline/community", request_query, params, options, logged_in_user)
    }
    statusBelongsTo(status) {
        const { community } = this.params
        if (status.community_id === community.id) {
            return true
        }
        return false
    }
}