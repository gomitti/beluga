import { observable, action } from "../../common/mobx"
import { request } from "../../../../../api"
import ws from "../../../../../websocket"
import assert, { is_array } from "../../../../../assert"

export default class ReactionsStore {
    @observable.shallow list = []
    constructor(status) {
        const { id, reactions } = status
        this.in_progress = false
        this.status_id = id
        if (is_array(reactions)) {
            this.set(reactions)
        }
        if (ws) {		// コミュニティサイドではやる意味がない
            ws.addEventListener("message", event => {
                const data = JSON.parse(event.data)
                if (data.reaction_added || data.reaction_removed) {
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
        assert(is_array(reactions), "$reactions must be a type of array")
        reactions.sort((a, b) => {
            if (a.order < b.order) {
                return -1
            }
            if (a.order > b.order) {
                return 1
            }
            return 0
        })
        const map_shortname_count = {}
        reactions.forEach(reaction => {
            const { shortname } = reaction
            if (shortname in map_shortname_count) {
                map_shortname_count[shortname] += 1
            } else {
                map_shortname_count[shortname] = 1
            }
        })
        const list = []
        for (const shortname in map_shortname_count) {
            const count = map_shortname_count[shortname]
            list.push({
                shortname, count
            })
        }
        this.list = list
    }
    @action.bound
    toggle(shortname) {
        if (this.in_progress) {
            return
        }
        this.in_progress = true
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
                this.in_progress = false
            })
    }
}