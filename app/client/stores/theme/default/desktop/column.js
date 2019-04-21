import { observable, action } from "../common/mobx"
import { sync as uid } from "uid-safe"
import assert, { is_object, is_array, is_string } from "../../../../assert"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import StatusStore, { StatusOptions } from "../common/status"
import MessageTimelineStore from "./timeline/message"
import ChannelTimelineStore from "./timeline/channel"
import CommunityTimelineStore from "./timeline/community"
import ThreadTimelineStore from "./timeline/thread"
import NotificationsTimelineStore from "./timeline/notifications"
import { TimelineOptions } from "./timeline"
import { PostboxOptions } from "../common/postbox"

export const get_timeline_store = (type, params, options, logged_in_user) => {
    if (type === enums.column.type.message) {
        const { recipient } = params
        assert(is_object(recipient), "$recipient must be of type object")
        const request_query = {
            "recipient_id": recipient.id,
        }
        return new MessageTimelineStore(request_query, params, options, logged_in_user)
    }
    if (type === enums.column.type.channel) {
        const { channel } = params
        assert(is_object(channel), "$channel must be of type object")
        const request_query = {
            "channel_id": channel.id,
        }
        return new ChannelTimelineStore(request_query, params, options, logged_in_user)
    }
    if (type === enums.column.type.community) {
        const { community } = params
        assert(is_object(community), "$community must be of type object")
        const request_query = {
            "community_id": community.id,
            "count": 60
        }
        return new CommunityTimelineStore(request_query, params, options, logged_in_user)
    }
    if (type === enums.column.type.thread) {
        const { in_reply_to_status, community } = params
        assert(is_object(in_reply_to_status), "$in_reply_to_status must be of type object")
        const request_query = {
            "in_reply_to_status_id": in_reply_to_status.id,
        }
        return new ThreadTimelineStore(request_query, params, options, logged_in_user)
    }
    if (type === enums.column.type.notifications) {
        const request_query = {}
        return new NotificationsTimelineStore(request_query, params, options, logged_in_user)
    }
    throw new Error("Invalid timeline")
}
export class ColumnOptions {
    constructor() {
        this.type = null
        this.is_closable = true
        this.timeline = new TimelineOptions()
        this.status = new StatusOptions()
        this.postbox = new PostboxOptions()
    }
}
export class ColumnSettings {
    constructor() {
        this.desktop_notification_enabled = false
    }
}

class ClientSideColumnStore {
    @observable.shallow timeline = null
    @observable type = null
    constructor(settings, muted_users, muted_words, logged_in_user, serialize_func) {
        assert(settings instanceof ColumnSettings, "$settings must be an instance of ColumnSettings")
        assert(is_array(muted_users), "$muted_users must be of type array")
        assert(is_array(muted_words), "$muted_words must be of type array")
        assert(is_object(logged_in_user), "$logged_in_user must be of type object")
        this.identifier = uid(8)    // Reactのkeyに使う
        this.settings = settings
        this.muted_users = muted_users
        this.muted_words = muted_words
        this.muted_users.forEach(user => {
            assert(is_object(user), "$user must be of type object")
        })
        this.muted_words.forEach(word => {
            assert(is_string(word), "$word must be of type string")
        })
        this.logged_in_user = logged_in_user
        this.serialize_func = serialize_func

        this.options = null
        this.params = null
        this.history = []
        this.is_closable = false
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

        this.timeline = get_timeline_store(type, params, options.timeline, this.logged_in_user)
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
        // if (this.timeline.auto_reloading_enabled) {
        //     this.timeline.fetchLatest()
        // }
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
    setDesktopNotificationEnabled = enabled => {
        this.settings.desktop_notification_enabled = enabled
        if (this.serialize_func) {
            this.serialize_func()
        }
    }
}

class ServerSideColumnStore {
    constructor(settings, muted_users, muted_words) {
        this.identifier = uid(8)    // Reactのkeyに使う
        assert(settings instanceof ColumnSettings, "$settings must be an instance of ColumnSettings")
        this.settings = settings
        this.muted_users = []
        if (muted_users) {
            muted_users.forEach(user => {
                assert(is_object(user), "$user must be of type object")
                this.muted_users.push(assign(user)) // サーバーサイドではuserはグローバルスコープなのでコピー
            })
        }
        this.muted_words = muted_words ? muted_words : []
        this.muted_words.forEach(word => {
            assert(is_string(word), "$word must be of type string")
        })

        this.timeline = null
        this.type = null
        this.options = null
        this.params = null
        this.history = []
        this.is_closable = false
    }
    set = (type, params, options, initial_statuses) => {
        assert(is_string(type), "$type must be of type string")
        assert(is_object(params), "$params must be of type object")
        assert(options instanceof ColumnOptions, "$options must be an instance of ColumnOptions")

        this.timeline = get_timeline_store(type, params, options.timeline, this.logged_in_user)
        if (Array.isArray(initial_statuses)) {
            this.timeline.setStatuses(initial_statuses)
        }
        this.type = type
        this.options = options
        this.params = params
    }
    push = (type, params, options, initial_statuses) => {
        assert(is_string(type), "$type must be of type string")
        assert(is_object(params), "$params must be of type object")
        assert(options instanceof ColumnOptions, "$options must be an instance of ColumnOptions")
        this.history.push({ type, params, options })
        this.set(type, params, options, initial_statuses)
    }
}

const get_store_class = () => {
    if (typeof window === "undefined") {
        return ServerSideColumnStore
    } else {
        return ClientSideColumnStore
    }
}

export const ColumnStore = get_store_class()