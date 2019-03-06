import { observable, action } from "../../common/mobx"
import ws from "../../../../../websocket"
import assign from "../../../../../libs/assign"
import { request } from "../../../../../api"
import StatusStore from "../../../../../stores/theme/default/common/status"

export default class MentionsStore {
    @observable.shallow statuses = [] 	// 取得済みの全ての投稿
    constructor(recipient_id, params) {
        this.recipient_id = recipient_id
        this.params = params
        if (ws) {
            ws.addEventListener("message", event => {
                const data = JSON.parse(event.data)
                if (data.mention_received) {
                    const { recipient } = data
                    if (recipient.id === this.recipient_id) {
                        this.update()
                    }
                }
            })
        }
    }
    @action.bound
    prepend(status) {
        if (Array.isArray(status)) {
            for (let i = status.length - 1; i >= 0; i--) {
                this.statuses.unshift(status[i])
            }
            return
        }
        this.statuses.unshift(status)
    }
    update = async () => {
        const params = assign({
            "recipient_id": this.recipient_id,
            "trim_user": false,
            "trim_community": false,
            "trim_channel": false,
            "trim_recipient": false,
        }, this.params)
        if (this.statuses.length > 0) {
            params.since_id = this.statuses[0].id
        }
        request
            .get("/timeline/mentions", { params })
            .then(response => {
                const { data } = response
                const { success, statuses } = data
                if (success) {
                    const stores = []
                    statuses.forEach(status => {
                        const store = new StatusStore(status)
                        stores.push(store)
                    })
                    this.prepend(stores)
                }
            })
            .catch(error => {

            })
    }
}