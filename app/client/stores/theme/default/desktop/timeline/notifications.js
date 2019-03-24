import TimelineStore from "./index"

export default class Store extends TimelineStore {
    constructor(request_query, params, options, logged_in_user) {
        super("/timeline/notifications", request_query, params, options, logged_in_user)
    }
    statusBelongsTo(status) {
        return false
    }
}