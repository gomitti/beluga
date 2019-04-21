import { observable, action } from "../../common/mobx"
import { request } from "../../../../../api"
import ws from "../../../../../websocket"
import assert, { is_array } from "../../../../../assert"

export default class ReactionsStore {
    @observable.shallow list = []
    constructor(status, logged_in_user) {
        const { id, reactions } = status
        this.in_progress = false
        this.status_id = id
        this.logged_in_user = logged_in_user
        this.reactions = []
        if (is_array(reactions)) {
            this.set(reactions)
        }
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
        const map_shortname_user_names = {}
        reactions.forEach(reaction => {
            const { shortname, user } = reaction
            if (shortname in map_shortname_count) {
                map_shortname_count[shortname] += 1
            } else {
                map_shortname_count[shortname] = 1
            }
            if (shortname in map_shortname_user_names) {
                map_shortname_user_names[shortname].push(user.name)
            } else {
                map_shortname_user_names[shortname] = [user.name]
            }
        })
        const list = []
        for (const shortname in map_shortname_count) {
            const count = map_shortname_count[shortname]
            const user_names = map_shortname_user_names[shortname]
            list.push({
                shortname, count, user_names
            })
        }
        this.list = list
        this.reactions = reactions
    }
    get_my_reaction_index = shortname => {
        for (let j = 0; j < this.reactions.length; j++) {
            const reaction = this.reactions[j]
            if (reaction.user_id !== this.logged_in_user.id) {
                continue
            }
            if (reaction.shortname !== shortname) {
                continue
            }
            return j
        }
        return -1
    }
    @action.bound
    toggle(shortname) {
        if (this.in_progress) {
            return
        }
        this.in_progress = true
        const reaction_index = this.get_my_reaction_index(shortname)
        if (reaction_index === -1) {
            this.reactions.push({
                "shortname": shortname,
                "user": this.logged_in_user,
            })
            this.set(this.reactions)
        } else {
            this.reactions.splice(reaction_index, 1)
            this.set(this.reactions)
        }
        request
            .post("/reaction/toggle", { "status_id": this.status_id, "shortname": shortname })
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