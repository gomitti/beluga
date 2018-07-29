import { observable, action } from "mobx"
import { sync as uid } from "uid-safe"
import assert, { is_object, is_array, is_string } from "../../../../assert"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import StatusStore from "../common/status"
import HomeTimelineStore from "./timeline/home"
import HahstagTimelineStore from "./timeline/hashtag"
import ServerTimelineStore from "./timeline/server"

export const get_timeline_store = (type, params, options) => {
    if (type === enums.column.type.home) {
        const { user, server } = params
        assert(is_object(user), "@user must be of type object")
        assert(is_object(server), "@server must be of type object")
        const request_query = {
            "user_id": user.id,
            "server_id": server.id
        }
        return new HomeTimelineStore(request_query, params, options)
    }
    if (type === enums.column.type.hashtag) {
        const { hashtag } = params
        assert(is_object(hashtag), "@hashtag must be of type object")
        const request_query = {
            "hashtag_id": hashtag.id,
        }
        return new HahstagTimelineStore(request_query, params, options)
    }
    if (type === enums.column.type.server) {
        const { server } = params
        assert(is_object(server), "@server must be of type object")
        const request_query = {
            "server_id": server.id,
        }
        return new ServerTimelineStore(request_query, params, options)
    }
    return null
}
export const default_options = {
    "type": null,
    "is_closable": true,
    "timeline": {
        "cancel_update": false
    },
    "status": {
        "show_belonging": false
    },
    "postbox": {
        "is_hidden": false
    },
    "joining": false
}
export const default_settings = {
    "enable_desktop_notification": false,
}
export class ColumnStore {
    @observable.shallow timeline = null
    @observable settings = {}
    @observable type = null
    options = null
    params = null
    history = []
    is_closable = false
    constructor(target, settings) {
        this.target = target
        this.identifier = uid(8)    // Reactのkeyに使う
        this.settings = assign(default_settings, settings)
    }
    @action.bound
    update_settings(settings) {
        this.settings = assign(default_settings, settings)
    }
    @action.bound
    restore = (history, settings) => {
        assert(is_array(history), "@history must be of type array")
        assert(is_object(settings), "@settings must be of type object")
        this.settings = settings
        if (history.length === 1) {
            return
        }
        this.history = []
        for (const item of history) {
            assert(is_object(item), "@item must be of type array")
            const { type, params, options } = item
            assert(is_string(type), "@type must be of type string")
            assert(is_object(params), "@params must be of type object")
            assert(is_object(options), "@options must be of type object")
            this.history.push(item)
        }
        assert(this.history.length > 0, "length of @history must be greater than 0")
        const { type, params, options } = this.history[this.history.length - 1]
        this.set(type, params, options)
        this.timeline.update()
    }
    @action.bound
    set = (type, params, options, initial_statuses) => {
        this.timeline = get_timeline_store(type, params, options.timeline || {})
        assert(this.timeline, "@timeline must not be null")
        if (Array.isArray(initial_statuses)) {
            const status_stores = []
            for (const status of initial_statuses) {
                const store = new StatusStore(status)
                status_stores.push(store)
            }
            this.timeline.append(status_stores)
        }
        this.type = type
        this.options = options
        this.params = params
    }
    @action.bound
    push = (type, params, options, initial_statuses) => {
        assert(is_string(type), "@type must be of type string")
        assert(is_object(options), "@options must be of type object")
        assert(is_object(params), "@params must be of type object")
        options = assign(default_options, options)
        this.history.push({ type, params, options })
        this.set(type, params, options, initial_statuses)
        this.timeline.update()
    }
    @action.bound
    pop = () => {
        this.history.pop()
        if (this.history.length === 0) {
            return false
        }
        const { type, params, options } = this.history[this.history.length - 1]
        this.set(type, params, options)
        this.timeline.update()
        return true
    }
}