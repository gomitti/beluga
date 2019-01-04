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
import ThreadTimelineHeaderView from "./timeline/header/thread"
import HashtagTimelineHeaderView from "./timeline/header/channel"
import ServerTimelineHeaderView from "./timeline/header/server"
import { request } from "../../../../api"
import UploadManager from "../../../../stores/theme/default/common/uploader"
import StatusStore from "../../../../stores/theme/default/common/status"
import { get_shared_picker_store } from "../../../../stores/theme/default/common/emoji"
import PostboxStore, { destinations as postbox_destinations } from "../../../../stores/theme/default/common/postbox"


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
        const { channel } = column.params
        assert(column.type === enums.column.type.channel, "$column.type must be 'channel'")
        this.state = {
            "is_join_pending": false,
            "joined": channel.joined
        }
    }
    onJoin = event => {
        event.preventDefault()
        const { column } = this.props
        const { channel } = column.params
        this.setState({
            "is_join_pending": true
        })
        request
            .post("/channel/join", { "channel_id": channel.id })
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
        const { channel } = column.params
        const uploader = new UploadManager()
        const picker = get_shared_picker_store(server)
        const postbox = new PostboxStore(postbox_destinations.channel, column.params)
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    <HashtagTimelineHeaderView column={column} channel={channel} />
                    {this.state.joined ? null :
                        <div className="timeline-join">
                            <p className="hint">このチャンネルに参加すると投稿することができます</p>
                            <div className="submit">
                                <button
                                    className={classnames("button meiryo ready user-defined-bg-color", { "in-progress": this.state.is_join_pending })}
                                    onClick={this.onJoin}>
                                    <span className="progress-text">参加する</span>
                                    <span className="display-text">参加する</span>
                                </button>
                                <button className="button meiryo neutral user-defined-bg-color" onClick={() => {
                                    location.href = `/server/${channel.name}/about`
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
                                postbox={postbox}
                                timeline={column.timeline}
                                picker={picker}
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
        assert(column.type === enums.column.type.server, "$column.type must be 'server'")
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
        assert(column.type === enums.column.type.home, "$column.type must be 'home'")
        const { user } = column.params
        const uploader = new UploadManager()
        const picker = get_shared_picker_store(server)
        const postbox = new PostboxStore(postbox_destinations.home, column.params)
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    <HomeTimelineHeaderView column={column} user={user} />
                    <div className="content">
                        <div className="vertical-line"></div>
                        <PostboxView
                            postbox={postbox}
                            timeline={column.timeline}
                            picker={picker}
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

export class ThreadColumnView extends ColumnView {
    constructor(props) {
        super(props)
        const { in_reply_to_status } = props
        this.placeholder_status = new StatusStore(in_reply_to_status)
    }
    render() {
        const { in_reply_to_status, server, column, logged_in, pinned_media, recent_uploads, request_query } = this.props
        assert(column.type === enums.column.type.thread, "$column.type must be 'thread'")
        const { user } = column.params
        const uploader = new UploadManager()
        const picker = get_shared_picker_store(server)
        const postbox = new PostboxStore(postbox_destinations.thread, column.params)
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    <ThreadTimelineHeaderView column={column} in_reply_to_status={in_reply_to_status} />
                    <div className="content">
                        <div className="vertical"></div>
                        <PostboxView
                            postbox={postbox}
                            timeline={column.timeline}
                            picker={picker}
                            logged_in={logged_in}
                            uploader={uploader}
                            pinned_media={pinned_media}
                            recent_uploads={recent_uploads} />
                        <TimelineView
                            total_num_statuses={in_reply_to_status.comments_count}
                            in_reply_to_status={in_reply_to_status}
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