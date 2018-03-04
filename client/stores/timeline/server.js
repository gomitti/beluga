import TimelineStore from "./index"

export default class ServerTimelineStore extends TimelineStore {
	constructor(request_query, params, options) {
		super("/timeline/server", request_query, params, options)
	}
	statusBelongsTo(status) {
		const { server } = this.params
		if (status.server_id === server.id) {
			return true
		}
		return false
	}
}