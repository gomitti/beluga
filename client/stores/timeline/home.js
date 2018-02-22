import TimelineStore from "./index"

export default class HomeTimelineStore extends TimelineStore {
	constructor(request_query, params) {
		super("/timeline/home", request_query, params)
	}
	statusBelongsTo(status) {
		const { server, recipient } = this.params
		if (status.recipient_id === recipient.id && status.server_id === server.id) {
			return true
		}
		return false
	}
}