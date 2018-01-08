import { observable, action, computed } from "mobx"
import { request } from "../api"

export default class StatusStore {
	@observable likes_count = 0

	constructor(status) {
		for (const key in status) {
			if (key in this) {
				continue
			}
			this[key] = status[key]
		}
	}

	@action.bound
	incrementLikes() {
		this.likes_count += 1
	}

	@action.bound
	setLikesCount(count) {
		this.likes_count = count
	}

}