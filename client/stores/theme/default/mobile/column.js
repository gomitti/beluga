import { observable, action } from "mobx"
import { sync as uid } from "uid-safe"
import assert, { is_object, is_array } from "../../../../assert"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import StatusStore from "../common/status"
import HomeTimelineStore from "../desktop/timeline/home"
import HahstagTimelineStore from "../desktop/timeline/hashtag"
import ServerTimelineStore from "../desktop/timeline/server"

const get_timeline_store = (type, request_query, params, options) => {
    if (type === enums.column.type.home) {
        return new HomeTimelineStore(request_query, params, options)
    }
    if (type === enums.column.type.hashtag) {
        return new HahstagTimelineStore(request_query, params, options)
    }
    if (type === enums.column.type.server) {
        return new ServerTimelineStore(request_query, params, options)
    }
    return null
}
export const default_options = {
    "type": "hashtag",
    "timeline": {
        "cancel_update": false
    },
    "status": {
        "show_belonging": false
    },
    "postbox": {
        "is_hidden": false
    },
}
export default class ColumnStore {
    constructor(request_query, params, options, initial_statuses) {
        this.params = params
        this.options = assign(default_options, options)
        this.timeline = get_timeline_store(options.type, request_query, params, options.timeline || {})
        assert(this.timeline, "@timeline must not be null")
        if (Array.isArray(initial_statuses)) {
            const status_stores = []
            for (const status of initial_statuses) {
                const store = new StatusStore(status)
                status_stores.push(store)
            }
            this.timeline.append(status_stores)
        }
    }
}