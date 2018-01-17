import TimelineStore from "../timeline"

export default class HomeTimelineStore extends TimelineStore {
	constructor(request_query, params) {
		super("/timeline/home", request_query, params)
	}
	statusBelongsTo(status) {
		const { server, user } = this.params
		if (status.recipient_id === user.id && status.server_id === server.id) {
			return true
		}
		return false
	}
}