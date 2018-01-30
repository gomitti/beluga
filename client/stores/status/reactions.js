import { observable, action } from "mobx"
import { request } from "../../api"
import ws from "../../websocket"

export default class ReactionsStore {
	@observable list = {}
	constructor(status) {
		this.status_id = status.id
		if (typeof status.reactions === "object") {
			this.list = status.reactions
		}
		if (ws) {		// サーバーサイドではやる意味がない
			ws.addEventListener("message", (e) => {
				const data = JSON.parse(e.data)
				if (data.reaction_added) {
					const { status } = data
					if (status.id === this.status_id) {
						this.set(status.reactions)
					}
				}
			})
		}
	}
	get count() {
		return Object.keys(this.list).length
	}
	@action.bound
	set(reactions){
		this.list = reactions
	}
	@action.bound
	add(shortname) {
		request
			.post("/reaction/add", { "status_id": this.status_id, shortname })
			.then(res => {
				const data = res.data
				if (data.error) {
					alert(data.error)
					return
				}
			})
			.catch(error => {

			})
	}
}