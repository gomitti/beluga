import { Component } from "react"
import { observable, action } from "mobx"
import { observer } from "mobx-react"
import classnames from "classnames"
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
import UploadManager from "../../../../stores/theme/default/common/uploader"

class ColumnView extends Component {
    loadMoreStatuses = () => {
        const { column } = this.props
        const { timeline } = column
        timeline.more()
    }
}

export class HashtagColumnView extends ColumnView {
    constructor(props) {
        super(props)
        const { column } = props
        const { hashtag } = column.params
        assert(column.type === enums.column.type.hashtag, "@column.type must be 'hashtag'")
        this.state = {
            "is_join_pending": false,
            "joined": hashtag.joined
        }
    }
    onJoin = event => {
        event.preventDefault()
        const { column } = this.props
        const { hashtag } = column.params
        this.setState({
            "is_join_pending": true
        })
        request
            .post("/hashtag/join", { "hashtag_id": hashtag.id })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    return
                }
                this.setState({
                    "joined": true
                })
            })
            .catch(error => {
                alert(error)
            })
            .then(_ => {
                this.setState({
                    "is_join_pending": false
                })
            })
    }
    render() {
        const { server, column, logged_in, pinned_media, recent_uploads, request_query } = this.props
        const { hashtag } = column.params
        const uploader = new UploadManager()
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    <HashtagTimelineHeaderView column={column} hashtag={hashtag} />
                    {this.state.joined ? null :
                        <div className="timeline-join">
                            <p className="hint">このルームに参加すると投稿することができます</p>
                            <div className="submit">
                                <button
                                    className={classnames("button meiryo ready user-defined-bg-color", { "in-progress": this.state.is_join_pending })}
                                    onClick={this.onJoin}>
                                    <span className="progress-text">参加する</span>
                                    <span className="display-text">参加する</span>
                                </button>
                                <button className="button meiryo neutral user-defined-bg-color" onClick={() => {
                                    location.href = `/server/${hashtag.tagname}/about`
                                }}>
                                    <span className="display-text">詳細を見る</span>
                                </button>
                            </div>
                        </div>
                    }
                    <div className="content">
                        <div className="vertical"></div>
                        {this.state.joined === false ? null :
                            <PostboxView
                                {...column.params}
                                logged_in={logged_in}
                                uploader={uploader}
                                pinned_media={pinned_media}
                                recent_uploads={recent_uploads} />
                        }
                        <TimelineView
                            server={server}
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

export class ServerColumnView extends ColumnView {
    render() {
        const { server, column, logged_in, pinned_media, recent_uploads, request_query } = this.props
        assert(column.type === enums.column.type.server, "@column.type must be 'server'")
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    <ServerTimelineHeaderView column={column} server={server} />
                    <div className="content">
                        <div className="vertical"></div>
                        <TimelineView
                            server={server}
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

export class HomeColumnView extends ColumnView {
    render() {
        const { server, column, logged_in, pinned_media, recent_uploads, request_query } = this.props
        assert(column.type === enums.column.type.home, "@column.type must be 'home'")
        const { user } = column.params
        const uploader = new UploadManager()
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    <HomeTimelineHeaderView column={column} user={user} />
                    <div className="content">
                        <div className="vertical"></div>
                        <PostboxView
                            {...column.params}
                            logged_in={logged_in}
                            uploader={uploader}
                            pinned_media={pinned_media}
                            recent_uploads={recent_uploads} />
                        <TimelineView
                            server={server}
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