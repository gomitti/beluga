import TimelineStore from "./index"

export default class HashtagTimelineStore extends TimelineStore {
	constructor(request_query, params) {
		super("/timeline/hashtag", request_query, params)
	}
	statusBelongsTo(status) {
		const { hashtag } = this.params
		if (status.hashtag_id === hashtag.id) {
			return true
		}
		return false
	}
}