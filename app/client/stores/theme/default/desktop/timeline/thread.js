import TimelineStore from "./index"

export default class Store extends TimelineStore {
    constructor(request_query, params, options) {
        super("/timeline/thread", request_query, params, options)
    }
    statusBelongsTo(status) {
        const { in_reply_to_status } = this.params
        if (status.in_reply_to_status_id === in_reply_to_status.id) {
            return true
        }
        return false
    }
}