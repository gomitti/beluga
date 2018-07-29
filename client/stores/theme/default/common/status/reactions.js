import { observable, action } from "mobx"
import { request } from "../../../../../api"
import ws from "../../../../../websocket"
import assert, { is_array } from "../../../../../assert"

export default class ReactionsStore {
    @observable.shallow list = []
    constructor(status) {
        this.is_pending = false
        this.status_id = status.id
        if (is_array(status.reactions)) {
            this.list = status.reactions
        }
        if (ws) {		// サーバーサイドではやる意味がない
            ws.addEventListener("message", event => {
                const data = JSON.parse(event.data)
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
        return this.list.length
    }
    @action.bound
    set(reactions) {
        assert(is_array(reactions), "@reactions must be a type of array")
        this.list = reactions
    }
    @action.bound
    toggle(shortname) {
        if (this.is_pending) {
            return
        }
        this.is_pending = true
        request
            .post("/reaction/toggle", { "status_id": this.status_id, shortname })
            .then(res => {
                const data = res.data
                if (data.error) {
                    alert(data.error)
                    return
                }
            })
            .catch(error => {

            }).then(_ => {
                this.is_pending = false
            })
    }
}