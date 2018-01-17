import { observable, action, computed } from "mobx"
import { request } from "../api"
import LikesStore from "./status/likes"
import ws from "../websocket"

export default class StatusStore {
	@observable deleted = false

	constructor(status) {
		for (const key in status) {
			if (key in this) {	// observableなキーを除く
				continue
			}
			this[key] = status[key]
		}
		this.likes = observable(new LikesStore(status))
		if (ws) {		// サーバーサイドではやる意味がない
			ws.addEventListener("message", (e) => {
				const data = JSON.parse(e.data)
				if (data.status_deleted) {
					const { id } = data
					if (id === this.id) {
						this.setDeleted(true)
					}
				}
			})
		}
	}

	@action.bound
	destroy() {
		if (window.confirm("削除しますか？")){
			request
				.post("/status/destroy", { "id": this.id })
				.then(res => {
					const data = res.data
					if (data.error) {
						alsert(data.error)
						return
					}
					setDeleted(true)
				})
				.catch(error => {
				})
		}
	}

	@action.bound
	setDeleted(deleted) {
		this.deleted = deleted
	}
}