import TimelineStore from "./index"

export default class Store extends TimelineStore {
    constructor(request_query, params, options, logged_in_user) {
        super("/timeline/channel", request_query, params, options, logged_in_user)
    }
    statusBelongsTo(status) {
        const { channel } = this.params
        if (status.channel_id === channel.id) {
            return true
        }
        return false
    }
}