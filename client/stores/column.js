import { observable, action } from "mobx"
import { sync as uid } from "uid-safe"
import assert, { is_object, is_array } from "../assert"
import enums from "../enums"
import assign from "../libs/assign"
import StatusStore from "./status"
import HomeTimelineStore from "./timeline/home"
import HahstagTimelineStore from "./timeline/hashtag"
import ServerTimelineStore from "./timeline/server"

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
}
export const default_settings = {
	"enable_desktop_notification": false,
}
export class ColumnStore {
	@observable.shallow timeline = null
	@observable settings = {}
	options = null
	params = null
	history = []
	is_closable = false
	constructor(target, settings) {
		this.target = target
		this.identifier = uid(8)
		this.settings = assign(default_settings, settings)
	}
	@action.bound
	update_settings(settings) {
		this.settings = assign(default_settings, settings)
	}
	@action.bound
	restore = (history, settings) => {
		assert(is_array(history), "@history must be array")
		assert(is_object(settings), "@settings must be object")
		this.settings = settings
		if(history.length === 1){
			return
		}
		this.history = []
		for(const item of history){
			assert(is_object(item), "@item must be array")
			const { request_query, params, options, settings } = item
			assert(is_object(request_query), "@request_query must be object")
			assert(is_object(params), "@params must be object")
			assert(is_object(options), "@options must be object")
			assert(is_object(settings), "@options must be object")
			this.history.push(item)
		}
		assert(this.history.length > 0, "length of @history must be greater than 0")
		const { request_query, params, options } = this.history[this.history.length - 1]
		this.setup(request_query, params, options)
		this.timeline.update()
	}
	setup = (request_query, params, options, initial_statuses) => {
		this.timeline = get_timeline_store(options.type, request_query, params, options.timeline || {})
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
	}
	@action.bound
	push = (request_query, params, options, initial_statuses) => {
		assert(is_object(options), "@options must be string")
		assert(is_object(request_query), "@request_query must be string")
		assert(is_object(params), "@params must be string")
		this.history.push({ request_query, params, options })
		this.setup(request_query, params, options, initial_statuses)
		this.timeline.update()
	}
	@action.bound
	pop = () => {
		this.history.pop()
		if (this.history.length === 0) {
			return false
		}
		const { request_query, params, options } = this.history[this.history.length - 1]
		this.setup(request_query, params, options)
		this.timeline.update()
		return true
	}
}