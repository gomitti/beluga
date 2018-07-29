import { observable, action } from "mobx"
import { sync as uid } from "uid-safe"
import assert, { is_object, is_array } from "../../../../assert"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import StatusStore from "../common/status"
import HomeTimelineStore from "../desktop/timeline/home"
import HahstagTimelineStore from "../desktop/timeline/hashtag"
import ServerTimelineStore from "../desktop/timeline/server"
import { get_timeline_store, default_options } from "../desktop/column"

export default class ColumnStore {
    constructor(type, params, options, initial_statuses) {
        this.type = type
        this.params = params
        this.options = assign(default_options, options)
        this.timeline = get_timeline_store(type, params, options.timeline)
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