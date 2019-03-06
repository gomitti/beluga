import { observable, action } from "../common/mobx"
import assert, { is_object, is_string } from "../../../../assert"
import { request } from "../../../../api"
import assign from "../../../../libs/assign";

export class PostboxOptions {
    constructor() {
        this.is_hidden = false
    }
}

export default class PostboxStore {
    @observable in_progress = false
    constructor(query) {
        this.query = query
    }
    @action.bound
    set_in_progress = flag => {
        this.in_progress = flag
    }
    @action.bound
    post = (text, callback_success, callback_error, callback_final) => {
        assert(is_string(text, "$text must be of type string"))
        const query = assign(this.query, { text })
        this.in_progress = true
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
                this.set_in_progress(false)
            })
    }
}