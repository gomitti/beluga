import { observable, action, computed } from "mobx";
import { request } from "../api"
import StatusStore from "./status"

export default class TimelineStore {
	// 取得済みの全ての投稿
	@observable statuses = [];

	constructor(endpoint, query) {
		this.endpoint = endpoint
		this.query = query
	}

	// ミュートなどでフィルタリングした投稿
	// 実際に画面に表示されるのはこれ
	@computed get filteredStatuses() {
		return this.statuses
	}

	// 新しい投稿を追加
	@action.bound
	prepend(status) {
		this.statuses.unshift(status)
	}

	// 古い投稿を追加
	@action.bound
	append(status) {
		this.statuses.push(status)
	}

	// 上からn個までの投稿を残しそれ以外を削除
	@action.bound
	splice(n) {
		this.statuses = this.statuses.splice(0, n)
	}

	@action.bound
	loadNewStatuses() {
		let params = Object.assign({

		}, this.query)
		request
			.post(this.endpoint, params)
			.then(res => {
				const data = res.data
				const top_status = this.statuses[0]
				for(const _status of data.statuses){
					const status = new StatusStore()
					status.text = _status.text
					status.userName = _status.user_name
					status.createdAt = _status.created_at
					if (status.createdAt > top_status.createdAt){
						this.prepend(status)
					}
				}
				this.splice(20)
			}).catch(error => {

			})
	}
}