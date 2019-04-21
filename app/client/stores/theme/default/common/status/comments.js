import { observable, action } from "../../common/mobx"
import { request } from "../../../../../api"
import ws from "../../../../../websocket"
import assert, { is_array, is_number } from "../../../../../assert"

export default class CommentsStore {
    @observable count = []
    @observable.shallow commenters = []
    constructor(status) {
        this.status_id = status.id
        this.set(status.comments_count, status.commenters)
        ws.addEventListener("message", event => {
            const data = JSON.parse(event.data)
            if (data.status_comments_updated) {
                const { id, comments_count, commenters } = data
                if (id === this.status_id) {
                    this.set(comments_count, commenters)
                }
            }
        })
    }
    get count() {
        return this.count
    }
    get commenters() {
        return this.commenters
    }
    @action.bound
    set(count, commenters) {
        assert(is_number(count), "$count must be a type of number")
        assert(is_array(commenters), "$commenters must be a type of array")
        this.count = count
        this.commenters = commenters
    }
}