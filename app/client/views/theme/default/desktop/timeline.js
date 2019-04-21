import { Component } from "react"
import { observer } from "mobx-react"
import StatusComponent from "./status"
import assign, { merge } from "../../../../libs/assign"
import assert, { is_function, is_number, is_object } from "../../../../assert";
import { get as get_desktop_settings } from "../../../../settings/desktop";
import { StatusOptions } from "../../../../stores/theme/default/common/status"
import { objectid_equals } from "../../../../libs/functions"
import { ColumnStore } from "../../../../stores/theme/default/desktop/column";

const get_status_group_footer_view = (status, link_text, click_handlers) => {
    const { handle_click_channel, handle_click_mention, handle_click_thread } = click_handlers
    const { in_reply_to_status_id } = status
    if (in_reply_to_status_id) {
        return <a className="link"
            href={`/thread/${in_reply_to_status_id}`}
            onClick={event => handle_click_thread(event, in_reply_to_status_id)}>{link_text}</a>
    }
    if (status.recipient_id) {
        const { recipient } = status
        assert(is_object(recipient), "@recipient must be of type object")
        const { name } = recipient
        return <a className="link"
            href={`/@${recipient.name}`}
            data-name={name}
            onClick={handle_click_mention}>{link_text}</a>
    }
    if (status.channel_id) {
        const { channel, community } = status
        assert(is_object(channel), "@channel must be of type object")
        assert(is_object(community), "@community must be of type object")
        return <a className="link"
            href={`/${community.name}/${channel.name}`}
            data-name={channel.name}
            onClick={handle_click_channel}>{link_text}</a>
    }
    return null
}

class TimelineComponentBase extends Component {
    constructor(props) {
        super(props)
        const { column, handle_click_channel, handle_click_mention, handle_click_thread, request_query } = this.props
        assert(column instanceof ColumnStore, "$column must be an instance of ColumnStore")
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
        const { column } = this.props
        const { timeline } = column
        timeline.fetchOlder()
    }
    fetchNewer = event => {
        const settings = get_desktop_settings()
        if (settings.multiple_columns_enabled === false) {
            return true
        }
        event.preventDefault()
        const { column } = this.props
        const { timeline } = column
        timeline.fetchNewer()
    }
    componentDidUpdate() {
        const { column } = this.props
        const { timeline } = column
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
    generateFetchNewerStatusesButton = () => {
        const { column, request_query } = this.props
        const { timeline } = column
        if (timeline.has_newer_statuses === false) {
            return null
        }
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
        return (
            <a className="fetch-statuses-button newer-statuses"
                href={`?${query_str}`}
                onClick={this.fetchNewer}>{display_text}</a>
        )
    }
    generateFetchOlderStatusesButton = () => {
        const { column, request_query } = this.props
        const { timeline } = column
        if (timeline.has_older_statuses === false) {
            return null
        }
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
        return (
            <a className="fetch-statuses-button older-statuses"
                href={`?${query_str}`}
                onClick={this.fetchOlder}>{display_text}</a>
        )
    }
}

@observer
export class StatusGroupTimelineComponent extends TimelineComponentBase {
    generateStatusGroupViews = () => {
        const { column, handle_click_channel, handle_click_mention, handle_click_thread,
            logged_in_user, in_reply_to_status, only_merge_thread } = this.props
        const { timeline } = column
        const merged_statuses = []
        let prev_status = null
        timeline.filtered_statuses.forEach(status => {
            if (status.deleted) {
                return
            }
            if (merged_statuses.length === 0) {
                merged_statuses.push([status])
                prev_status = status
                return
            }
            if (objectid_equals(prev_status.in_reply_to_status_id, status.in_reply_to_status_id)) {
                merged_statuses[merged_statuses.length - 1].push(status)
                prev_status = status
                return
            }
            if (only_merge_thread === true) {
                merged_statuses.push([status])
                prev_status = status
                return
            }
            if (objectid_equals(prev_status.recipient_id, status.recipient_id)) {
                merged_statuses[merged_statuses.length - 1].push(status)
                prev_status = status
                return
            }
            if (!!prev_status.in_reply_to_status_id === false &&
                !!status.in_reply_to_status_id === false &&
                objectid_equals(prev_status.channel_id, status.channel_id)) {
                merged_statuses[merged_statuses.length - 1].push(status)
                prev_status = status
                return
            }
            merged_statuses.push([status])
            prev_status = status
        })

        const statusGroupViews = []
        const click_handlers = { handle_click_channel, handle_click_mention, handle_click_thread }
        merged_statuses.forEach(statuses => {
            const count = statuses.length
            const first_status = statuses[0]
            const footerView = count === 1 ? null : <p className="footer">{get_status_group_footer_view(first_status, `他${count - 1}件の投稿を表示`, click_handlers)}</p>
            statusGroupViews.push(
                <div className="status-group" key={first_status.id}>
                    <div className="status-area">
                        <StatusComponent status={first_status}
                            key={first_status.id}
                            options={column.options.status}
                            handle_click_channel={handle_click_channel}
                            handle_click_mention={handle_click_mention}
                            handle_click_thread={handle_click_thread}
                            logged_in_user={logged_in_user} />
                    </div>
                    {footerView}
                </div>
            )
        })
        return statusGroupViews
    }
    render() {
        const fetchOlderButton = this.generateFetchOlderStatusesButton()
        const fetchNewerButton = this.generateFetchNewerStatusesButton()
        const statusGroupViews = this.generateStatusGroupViews()
        return (
            <div className="timeline-component webkit-scrollbar" ref="module">
                <div className="inside">
                    <div className="vertical-line"></div>
                    {fetchNewerButton}
                    {statusGroupViews}
                    {fetchOlderButton}
                </div>
            </div>
        )
    }
}


@observer
export class TimelineComponent extends TimelineComponentBase {
    render() {
        const { column, handle_click_channel, handle_click_mention, handle_click_thread,
            logged_in_user } = this.props
        const { in_reply_to_status } = column.params
        const { timeline } = column
        const fetchOlderButton = this.generateFetchOlderStatusesButton()
        const fetchNewerButton = this.generateFetchNewerStatusesButton()

        const statusViewList = []
        timeline.filtered_statuses.forEach(status => {
            if (status.deleted) {
                return
            }
            const options = new StatusOptions()
            options.trim_comments = column.options.status.trim_comments
            options.show_source_link = column.options.status.show_source_link
            if (in_reply_to_status && objectid_equals(status.id, in_reply_to_status.id)) {
                options.trim_comments = true
            }
            statusViewList.push(
                <StatusComponent status={status}
                    key={status.id}
                    options={options}
                    handle_click_channel={handle_click_channel}
                    handle_click_mention={handle_click_mention}
                    handle_click_thread={handle_click_thread}
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