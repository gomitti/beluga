import { get_timeline_store } from "../desktop/column"

export default class ColumnStore {
    constructor(type, params, options, initial_statuses) {
        this.type = type
        this.params = params
        this.options = options
        this.timeline = get_timeline_store(type, params, options.timeline)
        if (Array.isArray(initial_statuses)) {
            this.timeline.setStatuses(initial_statuses)
        }
    }
}