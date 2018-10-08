import TimelineStore from "./index"

export default class Store extends TimelineStore {
    constructor(request_query, params, options) {
        super("/timeline/notifications", request_query, params, options)
    }
    statusBelongsTo(status) {
        return false
    }
}