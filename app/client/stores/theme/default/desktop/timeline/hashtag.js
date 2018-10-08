import TimelineStore from "./index"

export default class Store extends TimelineStore {
    constructor(request_query, params, options) {
        super("/timeline/hashtag", request_query, params, options)
    }
    statusBelongsTo(status) {
        const { hashtag } = this.params
        if (status.hashtag_id === hashtag.id) {
            return true
        }
        return false
    }
}