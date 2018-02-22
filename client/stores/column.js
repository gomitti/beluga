import { observable, action } from "mobx"
import { sync as uid } from "uid-safe"
import assert, { is_object } from "../assert"
import { enum_column_type } from "../settings/desktop"
import StatusStore from "./status"
import HomeTimelineStore from "./timeline/home"
import HahstagTimelineStore from "./timeline/hashtag"
import ServerTimelineStore from "./timeline/server"

const get_timeline_store = (type, request_query, params) => {
	if (type === enum_column_type.home) {
		return new HomeTimelineStore(request_query, params)
	}
	if (type === enum_column_type.hashtag) {
		return new HahstagTimelineStore(request_query, params)
	}
	if (type === enum_column_type.server) {
		return new ServerTimelineStore(request_query, params)
	}
	return null
}

export const options = {
	"type": "hashtag",
	"status": {
		"show_belonging": false
	},
	"postbox": {
		"is_hidden": false
	},
}

export class ColumnStore {
	@observable.shallow timeline = null
	options = null
	params = null
	history = []
	constructor(target) {
		this.target = target
		this.identifier = uid(8)
	}
	setup = (request_query, params, options, initial_statuses) => {
		this.timeline = get_timeline_store(options.type, request_query, params)
		assert(this.timeline, "@timeline must not be null")
		if (initial_statuses instanceof Array) {
			const status_stores = []
			for (const status of initial_statuses) {
				const store = new StatusStore(status)
				status_stores.push(store)
			}
			this.timeline.append(status_stores)
		}
		this.options = options
		this.params = params
		this.timeline.update()
	}
	@action.bound
	push = (request_query, params, options, initial_statuses) => {
		assert(is_object(options), "@options must be string")
		assert(is_object(request_query), "@request_query must be string")
		assert(is_object(params), "@params must be string")
		this.history.push({ request_query, params, options })
		this.setup(request_query, params, options, initial_statuses)
	}
	@action.bound
	pop = () => {
		this.history.pop()
		if (this.history.length === 0) {
			return false
		}
		const { request_query, params, options } = this.history[this.history.length - 1]
		this.setup(request_query, params, options)
		return true
	}
}