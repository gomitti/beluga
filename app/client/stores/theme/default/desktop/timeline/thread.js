import TimelineStore from "./index"

export default class Store extends TimelineStore {
    constructor(request_query, params, options, logged_in_user) {
        super("/timeline/thread", request_query, params, options, logged_in_user)
    }
    statusBelongsTo(status) {
        const { in_reply_to_status } = this.params
        if (status.in_reply_to_status_id === in_reply_to_status.id) {
            return true
        }
        return false
    }
}