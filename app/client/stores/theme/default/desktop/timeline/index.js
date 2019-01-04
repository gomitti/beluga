import { observable, action, computed } from "mobx"
import { request } from "../../../../../api"
import StatusStore from "../../common/status"
import assign from "../../../../../libs/assign"
import ws from "../../../../../websocket"
import assert, { is_string, is_object, is_array } from "../../../../../assert";

const fetch_types = {
    "latest": 0,
    "older": 1,
    "newer": 2,
}

export class TimelineOptions {
    constructor() {
        this.reload_interval_sec = 10
        this.auto_reloading_enabled = true
        this.fetch_type = fetch_types.latest
        this.statuses_count_to_fetch_latest = 30
        this.statuses_count_to_fetch_older = 200
        this.statuses_count_to_fetch_newer = 200
        this.muted_users = []
        this.muted_words = []
        this.has_newer_statuses = false
        this.has_older_statuses = false
    }
    validate() {
        assert(is_array(this.muted_users), "$muted_users must be of type array")
        assert(is_array(this.muted_words), "$muted_words must be of type array")
    }
}

export default class TimelineStore {
    @observable.shallow filtered_status_stores = []
    @observable pending_fetch_newer = false
    @observable pending_fetch_older = false
    constructor(endpoint, request_query, params, options) {
        assert(is_string(endpoint), "$endpoint must be of type string")
        assert(is_object(request_query), "$request_query must be of type object")
        assert(options instanceof TimelineOptions, "$options must be an instance of TimelineOptions")
        options.validate()

        this.endpoint = endpoint
        this.request_query = assign(request_query)
        this.params = params

        this.current_fetch_type = null
        this.auto_reloading_enabled = options.auto_reloading_enabled
        this.timer_id = null
        this.pending_fetch_latest = false
        this.raw_status_objects = []
        this.filtered_status_stores = []

        this.fetch_type = options.fetch_type
        this.reload_interval_sec = options.reload_interval_sec
        this.auto_reloading_enabled = options.auto_reloading_enabled
        this.statuses_count_to_fetch_latest = options.statuses_count_to_fetch_latest
        this.statuses_count_to_fetch_older = options.statuses_count_to_fetch_older
        this.statuses_count_to_fetch_newer = options.statuses_count_to_fetch_newer
        this.muted_users = options.muted_users
        this.muted_words = options.muted_words
        this.has_newer_statuses = options.has_newer_statuses
        this.has_older_statuses = options.has_older_statuses
        this.original_has_newer_statuses = options.has_newer_statuses
        this.original_has_older_statuses = options.has_older_statuses
        this.status_store_cache = {}

        if (ws) {
            ws.addEventListener("message", (e) => {
                const data = JSON.parse(e.data)
                if (data.status_updated) {
                    const { status } = data
                    if (this.statusBelongsTo(status)) {
                        this.fetchLatestIfNeeded()
                    }
                }
            })
        }
        this.setIntervalIfNeeded()
    }
    // 自動更新の設定
    setIntervalIfNeeded = () => {
        if (this.timer_id) {
            clearInterval(this.timer_id)
        }
        if (this.auto_reloading_enabled) {
            console.log("[timeline] setting interval ...")
            this.timer_id = setInterval(() => {
                this.fetchLatestIfNeeded()
            }, this.reload_interval_sec * 1000) // msec
        }
    }
    // 継承先のクラスでこのメソッドをオーバーライドする
    // ある投稿がこのタイムラインに含まれているかどうかを判定する
    statusBelongsTo(status) {
        return true
    }
    getSinceId = () => {
        if (this.raw_status_objects.length === 0) {
            return null
        }
        return this.raw_status_objects[0].id
    }
    getMaxId = () => {
        if (this.raw_status_objects.length === 0) {
            return null
        }
        return this.raw_status_objects[this.raw_status_objects.length - 1].id
    }
    count = () => {
        return this.raw_status_objects.length
    }
    // ミュートの影響などで実際に表示される投稿は減ることがある
    @computed get filtered_statuses() {
        return this.filtered_status_stores
    }
    @action.bound
    setPendingFetchOlder = flag => {
        this.pending_fetch_older = flag
    }
    @action.bound
    setPendingFetchNewer = flag => {
        this.pending_fetch_newer = flag
    }
    @action.bound
    setStatuses = status_objs => {
        if (Object.keys(this.status_store_cache) > 500) {
            this.status_store_cache = {}
            console.log("[timeline] store cache released")
        }
        const filtered_status_stores = []
        status_objs.forEach(status_obj => {
            // 削除済み
            if (status_obj.deleted) {
                return
            }
            // ユーザーミュート
            for (let j = 0; j < this.muted_users.length; j++) {
                const muted_user = this.muted_users[j]
                if (status_obj.user.id === muted_user.id) {
                    return
                }
            }
            // 単語ミュート
            for (let j = 0; j < this.muted_words.length; j++) {
                const muted_word_str = this.muted_words[j]
                if (status_obj.text.indexOf(muted_word_str) !== -1) {
                    return
                }
            }

            if (this.status_store_cache.hasOwnProperty(status_obj.id)) {
                const store = this.status_store_cache[status_obj.id]
                filtered_status_stores.push(store)
            } else {
                const store = new StatusStore(status_obj)
                filtered_status_stores.push(store)
                this.status_store_cache[status_obj.id] = store
            }
        })

        this.filtered_status_stores = filtered_status_stores
        this.raw_status_objects = status_objs

    }
    fetchLatestIfNeeded = async () => {
        if (this.pending_fetch_latest === false && this.auto_reloading_enabled) {
            this.fetchLatest()
        }
    }
    // 最新の投稿を取得
    fetchLatest = async () => {
        this.current_fetch_type = fetch_types.latest
        this.auto_reloading_enabled = true
        if (this.pending_fetch_latest) {
            return
        }
        console.log("[timeline] fetching latest statuses ...")
        this.pending_fetch_latest = true
        const query = {
            "trim_user": false,
            "trim_server": false,
            "trim_channel": false,
            "trim_recipient": false,
            "count": this.statuses_count_to_fetch_latest,
        }
        try {
            const res = await request.get(this.endpoint, assign(query, this.request_query))
            if (res.success === false) {
                throw new Error(res.error)
            }
            if (this.current_fetch_type === fetch_types.latest) {
                const { data } = res
                const { statuses } = data
                this.setStatuses(statuses)
                this.has_newer_statuses = false
                this.has_older_statuses = this.original_has_older_statuses
            }
        } catch (error) {

        }
        this.pending_fetch_latest = false
    }
    // max_idを指定して投稿を取得
    fetchOlder = async () => {
        this.current_fetch_type = fetch_types.older
        this.auto_reloading_enabled = false
        if (this.pending_fetch_older) {
            return
        }
        console.log("[timeline] fetching older statuses ...")
        this.setPendingFetchOlder(true)
        const query = {
            "trim_user": false,
            "trim_server": false,
            "trim_channel": false,
            "trim_recipient": false,
            "max_id": this.getMaxId(),
            "count": this.statuses_count_to_fetch_older,
        }
        try {
            const res = await request.get(this.endpoint, assign(query, this.request_query))
            if (res.success === false) {
                throw new Error(res.error)
            }
            if (this.current_fetch_type === fetch_types.older) {
                const { data } = res
                const { statuses } = data
                console.log(`[timeline] fetched older statuses (length: ${statuses.length}`)
                if (statuses.length === 0) {
                    this.has_newer_statuses = true
                    this.has_older_statuses = false
                    console.log(`[timeline] newer: ${this.has_newer_statuses} older: ${this.has_older_statuses}`)
                } else {
                    this.setStatuses(statuses)
                    if (statuses.length < this.statuses_count_to_fetch_older) {
                        this.has_newer_statuses = true
                        this.has_older_statuses = false
                        console.log(`[timeline] ${statuses.length} < ${this.statuses_count_to_fetch_older}`)
                        console.log(`[timeline] newer: ${this.has_newer_statuses} older: ${this.has_older_statuses}`)
                    } else {
                        this.has_newer_statuses = true
                        this.has_older_statuses = true
                        console.log(`[timeline] newer: ${this.has_newer_statuses} older: ${this.has_older_statuses}`)
                    }
                }
            }
        } catch (error) {

        }
        this.setPendingFetchOlder(false)
    }
    // since_idを指定して投稿を取得
    fetchNewer = async () => {
        this.current_fetch_type = fetch_types.newer
        this.auto_reloading_enabled = false
        if (this.pending_fetch_newer) {
            return
        }
        console.log("[timeline] fetching newer statuses ...")
        this.setPendingFetchNewer(true)
        const query = {
            "trim_user": false,
            "trim_server": false,
            "trim_channel": false,
            "trim_recipient": false,
            "since_id": this.getSinceId(),
            "count": this.statuses_count_to_fetch_older,
        }
        try {
            const res = await request.get(this.endpoint, assign(query, this.request_query))
            if (res.success === false) {
                throw new Error(res.error)
            }
            if (this.current_fetch_type === fetch_types.newer) {
                const { data } = res
                const { statuses } = data
                console.log(`[timeline] fetched older statuses (length: ${statuses.length}`)
                if (statuses.length === 0) {
                    this.has_newer_statuses = false
                    this.has_older_statuses = true
                    this.auto_reloading_enabled = true
                    console.log(`[timeline] newer: ${this.has_newer_statuses} older: ${this.has_older_statuses} auto_reloading_enabled: ${this.auto_reloading_enabled}`)
                } else {
                    this.setStatuses(statuses)
                    if (statuses.length < this.statuses_count_to_fetch_newer) {
                        this.has_newer_statuses = false
                        this.has_older_statuses = true
                        this.auto_reloading_enabled = true
                        console.log(`[timeline] ${statuses.length} < ${this.statuses_count_to_fetch_newer}`)
                        console.log(`[timeline] newer: ${this.has_newer_statuses} older: ${this.has_older_statuses}`)
                    } else {
                        this.has_newer_statuses = true
                        this.has_older_statuses = true
                        console.log(`[timeline] newer: ${this.has_newer_statuses} older: ${this.has_older_statuses}`)
                    }
                }
            }
        } catch (error) {

        }
        this.setPendingFetchNewer(false)
    }
}