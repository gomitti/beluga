import { Component } from "react"
import { observer } from "mobx-react"
import StatusView from "./status"
import assign from "../../../../libs/assign"
import assert, { is_function, is_number } from "../../../../assert";

@observer
export default class TimelineView extends Component {
    constructor(props) {
        super(props)
        const { timeline, options, handle_click_hashtag, handle_click_mention, handle_click_thread, request_query } = this.props
        assert(is_function(handle_click_hashtag), "$handle_click_hashtag must be of type function at TimelineView.constructor")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function at TimelineView.constructor")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function at TimelineView.constructor")
    }
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
                    this.requested_href = href
                    this.loadMoreStatuses()
                }
            }
        })
    }
    loadMoreStatuses = () => {
        const { timeline } = this.props
        timeline.more()
    }
    onClickMoreLink = event => {
        event.preventDefault()
        this.loadMoreStatuses()
        this.more_link_clicked_more_than_once = true
    }
    render() {
        const { timeline, options, handle_click_hashtag, handle_click_mention, handle_click_thread, request_query, logged_in, in_reply_to_status } = this.props
        const statuses = timeline.filteredStatuses
        let moreLinkView = null
        if (timeline.no_more_statuses === false && statuses.length > 0 && typeof location !== "undefined") {
            const status = statuses[statuses.length - 1]
            const query = assign(request_query, {
                "max_id": status.id,
                "count": 500
            })
            let query_str = ""
            for (const key in query) {
                query_str += `${key}=${query[key]}&`
            }
            query_str = query_str.substring(0, query_str.length - 1)
            const display_text = timeline.pending_more ? "読み込み中" : "続きを表示"
            moreLinkView = <a className="more-link"
                ref="more"
                href={`${location.origin}${location.pathname}?${query_str}`}
                onClick={this.onClickMoreLink}>{display_text}</a>
        }

        const { total_num_statuses } = this.props
        if (is_number(total_num_statuses) && total_num_statuses <= 20) {
            moreLinkView = null
        }


        return (
            <div className="timeline-module">
                {statuses.map(status => {
                    if (status.deleted) {
                        return null
                    }
                    let trim_comments = false
                    if (in_reply_to_status && status.id === in_reply_to_status.id) {
                        trim_comments = true
                    }
                    return <StatusView status={status}
                        key={status.id}
                        options={options.status || {}}
                        handle_click_hashtag={handle_click_hashtag}
                        handle_click_mention={handle_click_mention}
                        handle_click_thread={handle_click_thread}
                        trim_comments={trim_comments}
                        logged_in={logged_in} />
                })}
                {moreLinkView}
            </div>
        )
    }
}