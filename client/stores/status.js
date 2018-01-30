import { observable, action, computed } from "mobx"
import { request } from "../api"
import LikesStore from "./status/likes"
import FavoritesStore from "./status/favorites"
import ReactionsStore from "./status/reactions"
import ws from "../websocket"

export default class StatusStore {
	@observable deleted = false
	@observable favorited = false

	constructor(status) {
		for (const key in status) {
			if (key in this) {	// observableなキーを除く
				continue
			}
			this[key] = status[key]
		}
		this.likes = observable(new LikesStore(status))
		this.favorites = observable(new FavoritesStore(status, this))
		this.reactions = observable(new ReactionsStore(status))
		this.favorited = !!status.favorited
		if (ws) {
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
	@action.bound
	setFavorited(favorited) {
		this.favorited = favorited
	}
}