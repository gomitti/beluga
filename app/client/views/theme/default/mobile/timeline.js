import { Component } from "react"
import { observer } from "mobx-react"
import StatusComponent from "./status"
import assign from "../../../../libs/assign"
import config from "../../../../beluga.config"
import assert, { is_number, is_object } from "../../../../assert"
import { objectid_equals } from "../../../../libs/functions"
import { StatusOptions } from "../../../../stores/theme/default/common/status"

const get_status_group_footer_view = (status, link_text) => {
    const { in_reply_to_status_id } = status
    if (in_reply_to_status_id) {
        return <a className="link" href={`/thread/${in_reply_to_status_id}`}>{link_text}</a>
    }
    if (status.recipient_id) {
        const { recipient } = status
        assert(is_object(recipient), "@recipient must be of type object")
        const { name } = recipient
        return <a className="link" href={`/@${recipient.name}`}>{link_text}</a>
    }
    if (status.channel_id) {
        const { channel, community } = status
        assert(is_object(channel), "@channel must be of type object")
        assert(is_object(community), "@community must be of type object")
        return <a className="link" href={`/${community.name}/${channel.name}`}>{link_text}</a>
    }
    return null
}

class TimelineComponentBase extends Component {
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
    generateStatusGroupComponents = () => {
        const { column, logged_in_user, in_reply_to_status, only_merge_thread } = this.props
        const { timeline } = column
        const { community } = column.params
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

        const statusGroupComponents = []
        merged_statuses.forEach(statuses => {
            const count = statuses.length
            const first_status = statuses[0]
            const footerComponent = count === 1 ? null : <p className="footer">{get_status_group_footer_view(first_status, `他${count - 1}件の投稿を表示`, community)}</p>
            statusGroupComponents.push(
                <div className="status-group" key={first_status.id}>
                    <div className="status-area">
                        <StatusComponent status={first_status}
                            key={first_status.id}
                            options={column.options.status}
                            community={community}
                            logged_in_user={logged_in_user} />
                    </div>
                    {footerComponent}
                </div>
            )
        })
        return statusGroupComponents
    }
    render() {
        const fetchOlderButton = this.generateFetchOlderStatusesButton()
        const fetchNewerButton = this.generateFetchNewerStatusesButton()
        const statusGroupComponents = this.generateStatusGroupComponents()
        return (
            <div className="timeline-component">
                {fetchNewerButton}
                {statusGroupComponents}
                {fetchOlderButton}
            </div>
        )
    }
}

@observer
export class TimelineComponent extends TimelineComponentBase {
    render() {
        const { placeholder, column, logged_in_user, request_query } = this.props
        const { in_reply_to_status, community } = column.params
        const { timeline } = column

        const fetchOlderButton = this.generateFetchOlderStatusesButton()
        const fetchNewerButton = this.generateFetchNewerStatusesButton()

        const status_options = assign(column.options.status)

        const statusComponentList = []
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
            statusComponentList.push(
                <StatusComponent
                    status={status}
                    community={community}
                    logged_in_user={logged_in_user}
                    key={status.id}
                    options={options} />
            )
        })

        return (
            <div className="timeline-component">
                {fetchNewerButton}
                {statusComponentList}
                {fetchOlderButton}
            </div>
        )
    }
}