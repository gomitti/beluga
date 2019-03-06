import { observable, action } from "../common/mobx"
import { request } from "../../../../api"
import ws from "../../../../websocket"
import LikesStore from "./status/likes"
import FavoritesStore from "./status/favorites"
import ReactionsStore from "./status/reactions"
import CommentsStore from "./status/comments"

export class StatusOptions {
    constructor() {
        this.show_source_link = false
        this.trim_comments = false
    }
}

export default class StatusStore {
    @observable deleted = false
    @observable favorited = false
    @observable.shallow last_comment = null

    constructor(status) {
        for (const key in status) {
            if (key in this) {	// observableなキーを除く
                continue
            }
            this[key] = status[key]
        }
        if (status.last_comment) {
            this.setLastComment(status.last_comment)
        }
        this.likes = observable(new LikesStore(status))
        this.favorites = observable(new FavoritesStore(status, this))
        this.reactions = observable(new ReactionsStore(status))
        this.comments = observable(new CommentsStore(status))
        this.favorited = !!status.favorited
        if (ws) {
            ws.addEventListener("message", event => {
                const data = JSON.parse(event.data)
                if (data.status_deleted) {
                    const { id } = data
                    if (id === this.id) {
                        this.setDeleted(true)
                    }
                }
                if (data.status_comments_updated) {
                    const { id, last_comment } = data
                    if (id === this.id) {
                        this.setLastComment(last_comment)
                    }
                }
            })
        }
    }
    @action.bound
    destroy() {
        if (window.confirm("削除しますか？")) {
            request
                .post("/status/destroy", { "id": this.id })
                .then(res => {
                    const data = res.data
                    if (data.error) {
                        alert(data.error)
                        return
                    }
                    this.setDeleted(true)
                })
                .catch(error => {
                    alert(error)
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
    @action.bound
    setLastComment(comment) {
        this.last_comment = comment
    }
}