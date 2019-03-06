import { observable, action } from "../../common/mobx"
import { request } from "../../../../../api"
import { is_array } from "../../../../../assert";
import ws from "../../../../../websocket"

export default class FavoritesStore {
    @observable.shallow users = []
    constructor(status, parent) {
        if (is_array(status.favorited_by) && status.favorited_by.length > 0) {
            this.users = status.favorited_by
        }
        this.status_id = status.id
        this.parent = parent
        if (ws) {		// コミュニティサイドではやる意味がない
            ws.addEventListener("message", (e) => {
                const data = JSON.parse(e.data)
                if (data.favorites_updated) {
                    const { status } = data
                    if (status.id === this.status_id) {
                        if (status.favorited_by) {
                            this.set(status.favorited_by)
                        }
                    }
                }
            })
        }
    }
    get count() {
        return this.users.length
    }
    @action.bound
    set(users) {
        this.users = users
    }
    @action.bound
    create() {
        request
            .post("/favorite/create", { "status_id": this.status_id })
            .then(res => {
                const { status, error } = res.data
                if (error) {
                    alert(error)
                    return
                }
                if (status.favorited_by) {
                    this.set(status.favorited_by)
                }
                this.parent.setFavorited(true)
            })
            .catch(error => {
                alert(error)
            })
    }
    @action.bound
    destroy() {
        request
            .post("/favorite/destroy", { "status_id": this.status_id })
            .then(res => {
                const { status, error } = res.data
                if (error) {
                    alert(error)
                    return
                }
                if (status.favorited_by && status.favorited_by) {
                    this.set(status.favorited_by)
                }
                this.parent.setFavorited(false)
            })
            .catch(error => {
                alert(error)
            })
    }
}