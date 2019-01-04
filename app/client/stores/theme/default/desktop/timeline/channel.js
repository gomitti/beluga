import TimelineStore from "./index"

export default class Store extends TimelineStore {
    constructor(request_query, params, options) {
        super("/timeline/channel", request_query, params, options)
    }
    statusBelongsTo(status) {
        const { channel } = this.params
        if (status.channel_id === channel.id) {
            return true
        }
        return false
    }
}