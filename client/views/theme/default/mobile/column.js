import { Component } from "react"
import { observable, action } from "mobx"
import { observer } from "mobx-react"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import assert, { is_object, is_array, is_string, is_function } from "../../../../assert"
import StatusView from "./status"
import PostboxView from "./postbox"
import TimelineView from "./timeline"
import HomeTimelineHeaderView from "./timeline/header/home"
import HashtagTimelineHeaderView from "./timeline/header/hashtag"
import ServerTimelineHeaderView from "./timeline/header/server"
import settings from "../../../../settings/desktop"
import { request } from "../../../../api"

export default class ColumnView extends Component {
    loadMoreStatuses = () => {
        const { column } = this.props
        const { timeline } = column
        timeline.more()
    }
    render() {
        const { column, logged_in, media_favorites, media_history, serialize, request_query } = this.props
        let headerView = null
        if (column.options.type === enums.column.type.home) {
            const { recipient } = column.params
            headerView = <HomeTimelineHeaderView column={column} serialize={serialize} recipient={recipient} onClose={this.onClose} onBack={this.onBack} />
        } else if (column.options.type === enums.column.type.hashtag) {
            const { hashtag } = column.params
            headerView = <HashtagTimelineHeaderView column={column} serialize={serialize} hashtag={hashtag} onClose={this.onClose} onBack={this.onBack} />
        } else if (column.options.type === enums.column.type.server) {
            const { server } = column.params
            headerView = <ServerTimelineHeaderView column={column} serialize={serialize} server={server} onClose={this.onClose} onBack={this.onBack} />
        }
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    {headerView}
                    <div className="content">
                        <div className="vertical"></div>
                        {column.options.postbox.is_hidden ? null : <PostboxView logged_in={logged_in} {...column.params} media_favorites={media_favorites} media_history={media_history} />}
                        <TimelineView
                            timeline={column.timeline}
                            request_query={request_query}
                            options={column.options}
                            load_more_statuses={this.loadMoreStatuses} />
                    </div>
                </div>
            </div>
        )
    }
}