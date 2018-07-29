import { observable, action, computed } from "mobx"
import { request } from "../../../../../api"
import StatusStore from "../../common/status"
import assign from "../../../../../libs/assign"
import ws from "../../../../../websocket"

export const default_options = {
    "cancel_update": false
}

export default class TimelineStore {
    @observable.shallow statuses = [] 	// 取得済みの全ての投稿
    @observable pending_update = false
    @observable pending_more = false
    constructor(endpoint, request_query, params, options) {
        this.endpoint = endpoint
        this.query = assign(request_query)
        this.params = assign(params)
        this.options = assign(default_options, options)
        this.no_more_statuses = false
        if (ws) {
            ws.addEventListener("message", (e) => {
                const data = JSON.parse(e.data)
                if (data.status_updated) {
                    const { status } = data
                    if (this.statusBelongsTo(status)) {
                        this.update()
                    }
                }
            })
            if (this.options.cancel_update === false) {
                setInterval(() => {
                    this.update()
                }, 30000)
            }
        }
    }

    @action.bound
    setNoMoreStatuses(yes_or_no) {
        this.no_more_statuses = yes_or_no
    }
    @action.bound
    setPendingUpdate(yes_or_no) {
        this.pending_update = yes_or_no
    }
    @action.bound
    setPendingMore(yes_or_no) {
        this.pending_more = yes_or_no
    }

    // 継承先のクラスでこのメソッドをオーバーライドする
    statusBelongsTo(status) {
        return true
    }

    // ミュートなどでフィルタリングした投稿
    // 実際に画面に表示されるのはこれ
    @computed get filteredStatuses() {
        return this.statuses
    }

    // 新しい投稿を追加
    @action.bound
    prepend(status) {
        if (Array.isArray(status)) {
            for (let i = status.length - 1; i >= 0; i--) {
                this.statuses.unshift(status[i])
            }
            return
        }
        this.statuses.unshift(status)
    }

    // 古い投稿を追加
    @action.bound
    append(status) {
        if (Array.isArray(status)) {
            for (let i = 0; i < status.length; i++) {
                this.statuses.push(status[i])
            }
            return
        }
        this.statuses.push(status)
    }

    // 上からn個までの投稿を残しそれ以外を削除
    @action.bound
    splice(n) {
        this.statuses = this.statuses.splice(0, n)
    }

    // 新しい投稿を読み込む
    async update() {
        if (this.options.cancel_update === true) {
            return
        }
        if (this.pending_update) {
            return
        }
        this.setPendingUpdate(true)
        const params = {
            "trim_user": false,
            "trim_server": false,
            "trim_hashtag": false,
            "trim_recipient": false,
        }
        if (this.statuses.length > 0) {
            params.since_id = this.statuses[0].id
        }
        const query = assign(params, this.query)
        try {
            const res = await request.get(this.endpoint, query)
            const data = res.data
            const stores = []
            for (const status of data.statuses) {
                const store = new StatusStore(status)
                stores.push(store)
            }
            this.prepend(stores)
        } catch (error) {

        }
        this.setPendingUpdate(false)
    }
    // 古い投稿を読み込む
    async more() {
        if (this.pending_more) {
            return
        }
        if (this.statuses.length === 0) {
            return
        }
        this.setPendingMore(true)
        const params = {
            "trim_user": false,
            "trim_server": false,
            "trim_hashtag": false,
            "trim_recipient": false,
            "count": 100
        }
        if (this.statuses.length > 0) {
            params.max_id = this.statuses[this.statuses.length - 1].id
        }
        const query = assign(params, this.query)
        try {
            const res = await request.get(this.endpoint, query)
            const data = res.data
            if (data.success === false) {
                alert(data.error)
                return
            }
            if (data.statuses.length === 0) {
                this.setNoMoreStatuses(true)
            }
            const stores = []
            for (const status of data.statuses) {
                const store = new StatusStore(status)
                stores.push(store)
            }
            this.append(stores)
        } catch (error) {

        }
        this.setPendingMore(false)
    }
}