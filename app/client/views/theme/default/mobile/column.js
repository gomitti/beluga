import { Component } from "react"
import classnames from "classnames"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import assert, { is_object, is_array, is_string, is_function } from "../../../../assert"
import StatusComponent from "./status"
import PostboxComponent from "./postbox"
import { TimelineComponent, StatusGroupTimelineComponent } from "./timeline"
import DirectMessageTimelineHeaderComponent from "./header/timeline/message"
import ThreadTimelineHeaderComponent from "./header/timeline/thread"
import ChannelTimelineHeaderComponent from "./header/timeline/channel"
import CommunityTimelineHeaderComponent from "./header/timeline/community"
import MessageTimelineHeaderComponent from "./header/timeline/message"
import NotificationsTimelineHeaderComponent from "./header/timeline/notifications"
import { request } from "../../../../api"
import UploadManager from "../../../../stores/theme/default/common/uploader"
import StatusStore from "../../../../stores/theme/default/common/status"
import PostboxStore from "../../../../stores/theme/default/common/postbox"
import ColumnStore from "../../../../stores/theme/default/mobile/column"
import { LoadingButton } from "./button"


class ColumnComponent extends Component {
    loadMoreStatuses = () => {
        const { column } = this.props
        const { timeline } = column
        timeline.more()
    }
}

const PostboxComponentOrNull = ({ column, is_hidden, postbox, logged_in_user, uploader, pinned_media, recent_uploads }) => {
    if (is_hidden) {
        return null
    }
    return (
        <PostboxComponent
            postbox={postbox}
            column={column}
            uploader={uploader}
            logged_in_user={logged_in_user}
            pinned_media={pinned_media}
            recent_uploads={recent_uploads} />
    )
}

const JoinChannelComponent = ({ handle_join, is_hidden }) => {
    if (is_hidden) {
        return null
    }
    return (
        <div className="timeline-join">
            <p className="hint">このチャンネルに参加すると投稿することができます</p>
            <div className="submit">
                <LoadingButton
                    is_loading={false}
                    onClick={handle_join}
                    is_neutral_color={false}>参加する</LoadingButton>
                <button className="button neutral user-defined-bg-color" onClick={() => {
                    location.href = `/${channel.name}`
                }}>
                    <span className="display-text">詳細を見る</span>
                </button>
            </div>
        </div>
    )
}

export class ChannelColumnComponent extends ColumnComponent {
    constructor(props) {
        super(props)
        const { column } = props
        assert(column instanceof ColumnStore, "$column must be an instance of ColumnStore")
        const { channel } = column.params
        assert(column.type === enums.column.type.channel, "$column.type must be 'channel'")
        this.uploader = new UploadManager()
        this.postbox = new PostboxStore({
            "channel_id": channel.id
        })
        this.state = {
            "joined": channel.joined
        }
    }
    onJoin = event => {
        event.preventDefault()
        const { column } = this.props
        const { channel } = column.params
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
    }
    render() {
        const { column, logged_in_user, pinned_media, recent_uploads, request_query } = this.props
        const { channel } = column.params
        return (
            <div className="column-component rounded-corner timeline">
                <div className="inside">
                    <ChannelTimelineHeaderComponent column={column} />
                    <JoinChannelComponent is_hidden={this.state.joined} handle_join={this.onJoin} />
                    <div className="contents">
                        <div className="vertical-line"></div>
                        <PostboxComponentOrNull
                            is_hidden={!this.state.joined}
                            logged_in_user={logged_in_user}
                            column={column}
                            postbox={this.postbox}
                            uploader={this.uploader}
                            pinned_media={pinned_media}
                            recent_uploads={recent_uploads} />
                        <TimelineComponent
                            column={column}
                            logged_in_user={logged_in_user}
                            request_query={request_query}
                            load_more_statuses={this.loadMoreStatuses} />
                    </div>
                </div>
            </div>
        )
    }
}

export class CommunityPublicTimelineColumnComponent extends ColumnComponent {
    render() {
        const { column, logged_in_user, pinned_media, recent_uploads, request_query } = this.props
        assert(column.type === enums.column.type.community, "$column.type must be 'community'")
        const { community } = column.params
        return (
            <div className="column-component rounded-corner timeline">
                <div className="inside">
                    <CommunityTimelineHeaderComponent community={community} />
                    <div className="contents">
                        <div className="vertical-line"></div>
                        <StatusGroupTimelineComponent
                            column={column}
                            logged_in_user={logged_in_user}
                            request_query={request_query}
                            load_more_statuses={this.loadMoreStatuses} />
                    </div>
                </div>
            </div>
        )
    }
}

export class ThreadColumnComponent extends ColumnComponent {
    constructor(props) {
        super(props)
        const { column } = props
        assert(column instanceof ColumnStore, "$column must be an instance of ColumnStore")
        const { in_reply_to_status } = column.params
        assert(is_object(in_reply_to_status), "$in_reply_to_status must be of type object")
        this.placeholder_status = new StatusStore(in_reply_to_status)
        this.uploader = new UploadManager()
        this.postbox = new PostboxStore({
            "in_reply_to_status_id": in_reply_to_status.id
        })
    }
    render() {
        const { column, logged_in_user, pinned_media, recent_uploads, request_query } = this.props
        assert(column.type === enums.column.type.thread, "$column.type must be 'thread'")
        const { user, in_reply_to_status } = column.params
        return (
            <div className="column-component rounded-corner timeline">
                <div className="inside">
                    <ThreadTimelineHeaderComponent in_reply_to_status={in_reply_to_status} />
                    <div className="contents">
                        <div className="vertical-line"></div>
                        <PostboxComponent
                            postbox={this.postbox}
                            column={column}
                            logged_in_user={logged_in_user}
                            uploader={this.uploader}
                            pinned_media={pinned_media}
                            recent_uploads={recent_uploads} />
                        <TimelineComponent
                            logged_in_user={logged_in_user}
                            column={column}
                            request_query={request_query}
                            load_more_statuses={this.loadMoreStatuses} />
                    </div>
                </div>
            </div>
        )
    }
}

export class MessageColumnComponent extends ColumnComponent {
    constructor(props) {
        super(props)
        const { column } = props
        assert(column instanceof ColumnStore, "$column must be an instance of ColumnStore")
        assert(column.type === enums.column.type.message, "$column.type must be 'message'")
        const { recipient } = column.params
        assert(is_object(recipient), "$recipient must be of type object")
        this.uploader = new UploadManager()
        this.postbox = new PostboxStore({
            "recipient_id": recipient.id
        })
    }
    render() {
        const { column, logged_in_user, pinned_media, recent_uploads, request_query } = this.props
        const { recipient } = column.params
        return (
            <div className="column-component rounded-corner timeline message">
                <div className="inside">
                    <MessageTimelineHeaderComponent recipient={recipient} />
                    <div className="contents">
                        <div className="vertical-line"></div>
                        <PostboxComponent
                            logged_in_user={logged_in_user}
                            column={column}
                            postbox={this.postbox}
                            uploader={this.uploader}
                            pinned_media={pinned_media}
                            recent_uploads={recent_uploads} />
                        <TimelineComponent
                            column={column}
                            logged_in_user={logged_in_user}
                            request_query={request_query}
                            load_more_statuses={this.loadMoreStatuses} />
                    </div>
                </div>
            </div>
        )
    }
}