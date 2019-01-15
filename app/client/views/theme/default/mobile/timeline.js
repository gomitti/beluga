import { Component } from "react"
import { observer } from "mobx-react"
import StatusView from "./status"
import assign from "../../../../libs/assign"
import config from "../../../../beluga.config"
import { is_number } from "../../../../assert";

@observer
export default class TimelineView extends Component {
    componentDidMount() {
        window.addEventListener("scroll", event => {
            if (this.more_link_clicked_more_than_once !== true) {
                return
            }
            const link = this.refs.more
            if (link) {
                const { href } = link
                if (this.requested_href === href) {
                    return
                }
                const { y } = link.getBoundingClientRect()
                if (y - 500 < window.innerHeight) {
                    const { load_more_statuses } = this.props
                    this.requested_href = href
                    load_more_statuses()
                }
            }
        })
    }
    onClickMoreLink = event => {
        event.preventDefault()
        const { load_more_statuses } = this.props
        load_more_statuses()
        this.more_link_clicked_more_than_once = true
    }
    render() {
        const { placeholder, server, timeline, status_options, logged_in_user,
            handle_click_channel, handle_click_mention, request_query, in_reply_to_status, } = this.props

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
            if (in_reply_to_status && status.id === in_reply_to_status.id) {
                trim_comments = true
            }
            statusViewList.push(
                <StatusView
                    status={status}
                    server={server}
                    logged_in_user={logged_in_user}
                    key={status.id}
                    options={status_options}
                    trim_comments={trim_comments}
                    handle_click_channel={handle_click_channel}
                    handle_click_mention={handle_click_mention} />
            )
        })

        return (
            <div className="timeline-component">
                {fetchNewerButton}
                {statusViewList}
                {fetchOlderButton}
            </div>
        )
    }
}