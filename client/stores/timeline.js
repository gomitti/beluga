import { observable, action, computed } from "mobx"
import { request } from "../api"
import StatusStore from "./status"

export default class TimelineStore {
	// 取得済みの全ての投稿
	@observable statuses = [];

	constructor(endpoint, query, model) {
		this.endpoint = endpoint
		this.query = query
		this.model = model
	}

	statusBelongsTo(status){
		if(!!status.hashtag && !!this.model.hashtag){
			if(status.hashtag.id === this.model.hashtag.id){
				return true
			}
		}
		return false
	}

	// ミュートなどでフィルタリングした投稿
	// 実際に画面に表示されるのはこれ
	@computed get filteredStatuses() {
		return this.statuses
	}

	// 新しい投稿を追加
	@action.bound
	prepend(status) {
		if(status instanceof Array){
			for(let i = status.length - 1;i >= 0;i--){
				this.statuses.unshift(status[i])
			}
			return
		}
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
	async loadNewStatuses() {
		const params = {
			"trim_user": false
		}
		if (this.statuses.length > 0) {
			params.since_id = this.statuses[0].id
		}
		const query = Object.assign(params, this.query)
		try {
			const res = await request.get(this.endpoint, { "params": query })
			const data = res.data
			const stores = []
			for (const status of data.statuses) {
				const store = new StatusStore(status)
				stores.push(store)
			}
			this.prepend(stores)
		} catch (error) {
			
		}
	}
}