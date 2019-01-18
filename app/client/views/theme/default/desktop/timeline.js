import { Component } from "react"
import { observer } from "mobx-react"
import StatusView from "./status"
import assign from "../../../../libs/assign"
import assert, { is_function, is_number } from "../../../../assert";
import { get as get_desktop_settings } from "../../../../settings/desktop";
import { TimelineOptions } from "../../../../stores/theme/default/desktop/timeline"
import { StatusOptions } from "../../../../stores/theme/default/common/status"
import { objectid_equals } from "../../../../libs/functions"

@observer
export default class TimelineView extends Component {
    constructor(props) {
        super(props)
        const { timeline, timeline_options, status_options,
            handle_click_channel, handle_click_mention, handle_click_thread, request_query } = this.props
        assert(timeline_options instanceof TimelineOptions, "$timeline_options must be an instance of TimelineOptions")
        assert(status_options instanceof StatusOptions, "$status_options must be an instance of StatusOptions")
        assert(is_function(handle_click_channel), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function")
        this.fetching_older_statuses_started = false
    }
    fetchOlder = event => {
        const settings = get_desktop_settings()
        if (settings.multiple_columns_enabled === false) {
            return true
        }
        event.preventDefault()
        const { timeline } = this.props
        timeline.fetchOlder()
    }
    fetchNewer = event => {
        const settings = get_desktop_settings()
        if (settings.multiple_columns_enabled === false) {
            return true
        }
        event.preventDefault()
        const { timeline } = this.props
        timeline.fetchNewer()
    }
    componentDidUpdate() {
        const { timeline } = this.props
        if (timeline.pending_fetch_older) {
            this.fetching_older_statuses_started = true
        }
        if (timeline.pending_fetch_older === false) {
            if (this.fetching_older_statuses_started) {
                const dom = this.refs.module
                if (dom) {
                    dom.scrollTop = 0
                }
                this.fetching_older_statuses_started = false
            }
        }
    }
    render() {
        const { timeline, timeline_options, status_options,
            handle_click_channel, handle_click_mention, handle_click_thread,
            request_query, logged_in_user, in_reply_to_status } = this.props
        let fetchOlderButton = null
        let fetchNewerButton = null
        if (timeline.has_newer_statuses) {
            const query = assign(request_query, {
                "since_id": timeline.getSinceId(),
                "count": timeline.statuses_count_to_fetch_newer
            })
            let query_str = ""
            for (const key in query) {
                if (key === "max_id") {
                    continue
                }
                query_str += `${key}=${query[key]}&`
            }
            query_str = query_str.substring(0, query_str.length - 1)
            const display_text = timeline.pending_fetch_newer ? "読み込み中" : "↑以降の投稿を表示"
            fetchNewerButton = (
                <a className="fetch-statuses-button newer-statuses"
                    href={`?${query_str}`}
                    onClick={this.fetchNewer}>{display_text}</a>
            )
        }
        if (timeline.has_older_statuses) {
            const query = assign(request_query, {
                "max_id": timeline.getMaxId(),
                "count": timeline.statuses_count_to_fetch_older
            })
            let query_str = ""
            for (const key in query) {
                if (key === "since_id") {
                    continue
                }
                query_str += `${key}=${query[key]}&`
            }
            query_str = query_str.substring(0, query_str.length - 1)
            const display_text = timeline.pending_fetch_older ? "読み込み中" : "↓以前の投稿を表示"
            fetchOlderButton = (
                <a className="fetch-statuses-button older-statuses"
                    href={`?${query_str}`}
                    onClick={this.fetchOlder}>{display_text}</a>
            )
        }

        const statusViewList = []
        timeline.filtered_statuses.forEach(status => {
            if (status.deleted) {
                return
            }
            let trim_comments = false
            if (in_reply_to_status && objectid_equals(status.id, in_reply_to_status.id)) {
                trim_comments = true
            }
            statusViewList.push(
                <StatusView status={status}
                    key={status.id}
                    options={status_options}
                    handle_click_channel={handle_click_channel}
                    handle_click_mention={handle_click_mention}
                    handle_click_thread={handle_click_thread}
                    trim_comments={trim_comments}
                    logged_in_user={logged_in_user} />
            )
        })

        return (
            <div className="timeline-component webkit-scrollbar" ref="module">
                <div className="inside">
                    <div className="vertical-line"></div>
                    {fetchNewerButton}
                    {statusViewList}
                    {fetchOlderButton}
                </div>
            </div>
        )
    }
}