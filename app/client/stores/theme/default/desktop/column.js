import { observable, action } from "mobx"
import { sync as uid } from "uid-safe"
import assert, { is_object, is_array, is_string } from "../../../../assert"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import StatusStore from "../common/status"
import HomeTimelineStore from "./timeline/home"
import ChannelTimelineStore from "./timeline/channel"
import ServerTimelineStore from "./timeline/server"
import ThreadTimelineStore from "./timeline/thread"
import NotificationsTimelineStore from "./timeline/notifications"
import { TimelineOptions } from "./timeline"

export const get_timeline_store = (type, params, options) => {
    if (type === enums.column.type.home) {
        const { user, server } = params
        assert(is_object(user), "$user must be of type object")
        assert(is_object(server), "$server must be of type object at get_timeline_store")
        const request_query = {
            "user_id": user.id,
            "server_id": server.id
        }
        return new HomeTimelineStore(request_query, params, options)
    }
    if (type === enums.column.type.channel) {
        const { channel } = params
        assert(is_object(channel), "$channel must be of type object")
        const request_query = {
            "channel_id": channel.id,
        }
        return new ChannelTimelineStore(request_query, params, options)
    }
    if (type === enums.column.type.server) {
        const { server } = params
        assert(is_object(server), "$server must be of type object")
        const request_query = {
            "server_id": server.id,
        }
        return new ServerTimelineStore(request_query, params, options)
    }
    if (type === enums.column.type.thread) {
        const { in_reply_to_status, server } = params
        assert(is_object(in_reply_to_status), "$in_reply_to_status must be of type object")
        const request_query = {
            "in_reply_to_status_id": in_reply_to_status.id,
        }
        return new ThreadTimelineStore(request_query, params, options)
    }
    if (type === enums.column.type.notifications) {
        const request_query = {}
        return new NotificationsTimelineStore(request_query, params, options)
    }
    throw new Error("Invalid timeline")
}
export class ColumnOptions {
    constructor() {
        this.type = null
        this.is_closable = true
        this.timeline = null
        this.status = {
            "show_belonging": false
        }
        this.postbox = {
            "is_hidden": false
        }
    }
}
export class ColumnSettings {
    @observable desktop_notification_enabled = false
    @action.bound
    setDesktopNotificationEnabled = on_off => {
        this.desktop_notification_enabled = on_off
    }
}
export class ColumnStore {
    @observable.shallow timeline = null
    @observable.shallow settings = null
    @observable type = null
    options = null
    params = null
    history = []
    is_closable = false
    constructor(target, settings, muted_users, muted_words) {
        this.target = target
        this.identifier = uid(8)    // Reactのkeyに使う
        assert(settings instanceof ColumnSettings, "$settings must be an instance of ColumnSettings")
        this.settings = settings
        this.muted_users = muted_users ? muted_users : []
        this.muted_words = muted_words ? muted_words : []
        this.muted_users.forEach(user => {
            assert(is_object(user), "$user must be of type object")
        })
        this.muted_words.forEach(word => {
            assert(is_string(word), "$word must be of type string")
        })
    }
    @action.bound
    restore = (history, settings) => {
        assert(is_array(history), "$history must be of type array")
        assert(is_object(settings), "$settings must be of type object")
        this.settings = settings
        if (history.length === 1) {
            return
        }
        this.history = []
        history.forEach(item => {
            assert(is_object(item), "$item must be of type array")
            const { type, params, options } = item
            assert(is_string(type), "$type must be of type string")
            assert(is_object(params), "$params must be of type object")
            assert(is_object(options), "$options must be of type object")
            this.history.push(item)
        })
        assert(this.history.length > 0, "length of $history must be greater than 0")
        const { type, params, options } = this.history[this.history.length - 1]
        this.set(type, params, options)
        if (this.timeline.auto_reloading_enabled) {
            this.timeline.fetchLatest()
        }
    }
    @action.bound
    set = (type, params, options, initial_statuses) => {
        assert(is_string(type), "$type must be of type string")
        assert(is_object(params), "$params must be of type object")
        assert(options instanceof ColumnOptions, "$options must be an instance of ColumnOptions")

        this.timeline = get_timeline_store(type, params, options.timeline, this.muted_users, this.muted_words)
        if (Array.isArray(initial_statuses)) {
            this.timeline.setStatuses(initial_statuses)
        }
        this.type = type
        this.options = options
        this.params = params
    }
    @action.bound
    push = (type, params, options, initial_statuses) => {
        assert(is_string(type), "$type must be of type string")
        assert(is_object(params), "$params must be of type object")
        assert(options instanceof ColumnOptions, "$options must be an instance of ColumnOptions")
        this.history.push({ type, params, options })
        this.set(type, params, options, initial_statuses)
        if (this.timeline.auto_reloading_enabled) {
            this.timeline.fetchLatest()
        }
    }
    @action.bound
    pop = () => {
        this.history.pop()
        if (this.history.length === 0) {
            return false
        }
        const { type, params, options } = this.history[this.history.length - 1]
        this.set(type, params, options)
        if (this.timeline.auto_reloading_enabled) {
            this.timeline.fetchLatest()
        }
        return true
    }
}