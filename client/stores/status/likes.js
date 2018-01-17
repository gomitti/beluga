import { observable, action } from "mobx"
import { request } from "../../api"
import ws from "../../websocket"

export default class LikesStore {
	@observable count = 0

	constructor(status) {
		this.count = parseInt(status.likes_count)
		this.status = status
		if (ws) {		// サーバーサイドではやる意味がない
			ws.addEventListener("message", (e) => {
				const data = JSON.parse(e.data)
				if (data.like_created) {
					const { status } = data
					if (status.id === this.status.id) {
						this.set(status.likes_count)
					}
				}
			})
		}
	}

	@action.bound
	set(count){
		this.count = count
	}

	@action.bound
	increment() {
		request
			.post("/like/create", { "id": this.status.id })
			.then(res => {
				const data = res.data
				if(data.error){
					return
				}
				this.set(data.status.likes_count)
			})
			.catch(error => {
			})
	}
}