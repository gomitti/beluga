import { Component } from "react"
import { observer } from "mobx-react"
import StatusView from "./status"
import assign from "../../../../libs/assign"

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
        const { timeline, options, onClickHashtag, onClickMention, request_query } = this.props
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
        return (
            <div className="timeline-module">
                {statuses.map(status => {
                    if (status.deleted) {
                        return null
                    }
                    return <StatusView status={status} key={status.id} options={options.status || {}} onClickHashtag={onClickHashtag} onClickMention={onClickMention} />
                })}
                {moreLinkView}
            </div>
        )
    }
}