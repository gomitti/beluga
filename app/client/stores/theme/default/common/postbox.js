import { observable, action } from "mobx"
import assert, { is_object, is_string } from "../../../../assert"
import { request } from "../../../../api"
import assign from "../../../../libs/assign";

export const destinations = {
    "channel": 1,
    "home": 2,
    "thread": 3,
}

export default class PostboxStore {
    @observable is_pending = false
    constructor(destination, params) {
        const { channel, user, server, in_reply_to_status } = params
        if (destination === destinations.channel) {
            assert(is_object(channel), "$channel must be of type object")
        } else if (destination === destinations.home) {
            assert(is_object(user), "$user must be of type object")
            assert(is_object(server), "$server must be of type object at PostboxStore.constructor")
        } else if (destination === destinations.thread) {
            assert(is_object(in_reply_to_status), "$in_reply_to_status must be of type object")
        } else {
            throw new Error("Invalid destination")
        }
        const query = {}
        if (destination === destinations.channel) {
            query.channel_id = channel.id
        } else if (destination === destinations.home) {
            query.recipient_id = user.id
            query.server_id = server.id
        } else if (destination === destinations.thread) {
            query.in_reply_to_status_id = in_reply_to_status.id
        }
        this.query = query
    }
    @action.bound
    set_is_pending = flag => {
        this.is_pending = flag
    }
    @action.bound
    post = (text, callback_success, callback_error, callback_final) => {
        assert(is_string(text, "$text must be of type string"))
        const query = assign(this.query, { text })
        this.is_pending = true
        request
            .post("/status/update", query)
            .then(res => {
                const { data } = res
                const { success, error } = data
                if (success == false) {
                    alert(error)
                    if (callback_error) {
                        callback_error()
                    }
                    return
                }
                if (callback_success) {
                    callback_success()
                }
            })
            .catch(error => {
                alert(error)
                if (callback_error) {
                    callback_error()
                }
            })
            .then(_ => {
                if (callback_final) {
                    callback_final()
                }
                this.set_is_pending(false)
            })
    }
}