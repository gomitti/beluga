import { observable, action, computed } from "mobx"
import { request } from "../api"
import StatusStore from "./status"
import ws from "../websocket"

export default class TimelineStore {
	// 取得済みの全ての投稿
	@observable statuses = [];

	constructor(endpoint, request_query, params) {
		this.endpoint = endpoint
		this.query = request_query
		this.params = params
		if (ws) {		// サーバーサイドではやる意味がない
			ws.addEventListener("message", (e) => {
				const data = JSON.parse(e.data)
				if (data.status_updated) {
					const { status } = data
					if (this.statusBelongsTo(status)) {
						this.update()
					}
				}
			})
			setInterval(() => {
				this.update()
			}, 30000)
		}
	}

	// ミュートなどでフィルタリングした投稿
	// 実際に画面に表示されるのはこれ
	@computed get filteredStatuses() {
		return this.statuses
	}

	// 新しい投稿を追加
	@action.bound
	prepend(status) {
		if (status instanceof Array) {
			for (let i = status.length - 1; i >= 0; i--) {
				this.statuses.unshift(status[i])
			}
			return
		}
		this.statuses.unshift(status)
	}

	// 古い投稿を追加
	@action.bound
	append(status) {
		if (status instanceof Array) {
			for (let i = 0; i < status.length; i++) {
				this.statuses.push(status[i])
			}
			return
		}
		this.statuses.push(status)
	}

	// 上からn個までの投稿を残しそれ以外を削除
	@action.bound
	splice(n) {
		this.statuses = this.statuses.splice(0, n)
	}

	// 新しい投稿を読み込む
	@action.bound
	async update() {
		if (this.pending) {
			return
		}
		this.pending = true
		const params = {
			"trim_user": false,
			"trim_server": false,
			"trim_hashtag": false,
			"trim_recipient": false,
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
		this.pending = false
	}
}