import TimelineStore from "./index"

export default class Store extends TimelineStore {
    constructor(request_query, params, options, logged_in_user) {
        super("/timeline/message", request_query, params, options, logged_in_user)
    }
    statusBelongsTo(status) {
        const { community, user } = this.params
        if (status.recipient_id === user.id && status.community_id === community.id) {
            return true
        }
        return false
    }
}