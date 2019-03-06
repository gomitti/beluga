import TimelineStore from "./index"

export default class Store extends TimelineStore {
    constructor(request_query, params, options) {
        super("/timeline/message", request_query, params, options)
    }
    statusBelongsTo(status) {
        const { community, user } = this.params
        if (status.recipient_id === user.id && status.community_id === community.id) {
            return true
        }
        return false
    }
}