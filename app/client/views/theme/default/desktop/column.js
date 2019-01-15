import { Component } from "react"
import { observable, action } from "mobx"
import { observer } from "mobx-react"
import classnames from "classnames"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import assert, { is_object, is_array, is_string, is_function, is_number } from "../../../../assert"
import { ColumnStore, ColumnOptions, ColumnSettings } from "../../../../stores/theme/default/desktop/column"
import StatusView from "./status"
import PostboxView from "./postbox"
import TimelineView from "./timeline"
import HomeTimelineHeaderView from "./timeline/header/home"
import HashtagTimelineHeaderView from "./timeline/header/channel"
import ThreadTimelineHeaderView from "./timeline/header/thread"
import ServerTimelineHeaderView from "./timeline/header/server"
import JoinedHashtagsListView from "../../../../views/theme/default/desktop/column/channels"
import ServerDetailView from "../../../../views/theme/default/desktop/column/server"
import { request } from "../../../../api"
import UploadManager from "../../../../stores/theme/default/common/uploader"
import StatusStore from "../../../../stores/theme/default/common/status"
import PostboxStore, { destinations as postbox_destinations } from "../../../../stores/theme/default/common/postbox"
import { get as get_desktop_settings } from "../../../../settings/desktop"
import { TimelineOptions } from "../../../../stores/theme/default/desktop/timeline"

@observer
export class MultipleColumnsContainerView extends Component {
    @observable.shallow columns = []
    equals = (a, b) => {
        assert(is_object(a), "$a must be of type object")
        assert(is_object(b), "$b must be of type object")
        if (a.type !== b.type) {
            return false
        }
        if (a.params.channel && b.params.channel) {
            if (a.params.channel.name === b.params.channel.name) {
                return true
            }
        }
        if (a.params.user && b.params.user) {
            if (a.params.user.id === b.params.user.id) {
                return true
            }
        }
        if (a.params.server && b.params.server) {
            if (a.params.server.id === b.params.server.id) {
                return true
            }
        }
        return false
    }
    serialize = () => {
        const columns = []
        for (const column of this.columns) {
            const { type, params } = column
            const param_ids = {}
            if (type === enums.column.type.channel) {
                const { channel } = params
                param_ids.channel_id = channel.id
            }
            if (type === enums.column.type.server) {
                const { server } = params
                param_ids.server_id = server.id
            }
            if (type === enums.column.type.home) {
                const { server, user } = params
                param_ids.server_id = server.id
                param_ids.user_id = user.id
            }
            if (type === enums.column.type.thread) {
                const { in_reply_to_status } = params
                param_ids.in_reply_to_status_id = in_reply_to_status.id
            }
            columns.push({ param_ids, type })
        }
        const { pathname } = location
        const key = `columns_${pathname}`
        request
            .post("/kvs/store", { "key": key, "value": columns })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                }
            })
            .catch(error => {
                alert(error)
            })
    }
    // 初期カラムを追加
    // @param {string} type
    // @param {object} params
    // @param {ColumnOptions} column_options
    // @param {ColumnSettings} column_settings
    // @param {array} initial_statuses
    // @param {number} target
    // @param {number} insert_position この位置の左隣に追加する
    // @param {array} muted_users
    // @param {array} muted_words
    @action.bound
    insert(type, params, column_options, column_settings, initial_statuses, target, insert_position, muted_users, muted_words) {
        assert(is_object(params), "$params must be of type object")
        assert(column_options instanceof ColumnOptions, "$column_options must be an instance of ColumnOptions")
        assert(column_settings instanceof ColumnSettings, "$column_settings must be an instance of ColumnSettings")
        assert(is_array(initial_statuses), "$initial_statuses must be of type array")
        assert(is_number(insert_position), "$insert_position must be of type number")
        const settings = get_desktop_settings()
        target = target || settings.new_column_target
        const column = new ColumnStore(target, column_settings, muted_users, muted_words)
        column.push(type, params, column_options, initial_statuses)
        if (insert_position === -1) {
            this.columns.push(column)
        } else {
            this.columns.splice(insert_position, 0, column)
        }
        return column
    }
    // ユーザー操作で追加
    // @param {string} type
    // @param {object} params
    // @param {ColumnOptions} column_options
    // @param {ColumnSettings} column_settings
    // @param {array} initial_statuses
    // @param {number} target
    // @param {ColumnStore} source_column
    @action.bound
    open = (type, params, column_options, column_settings, initial_statuses, target, source_column) => {
        assert(is_string(type), "$type must be of type string")
        assert(is_object(params), "$params must be of type object")
        assert(column_options instanceof ColumnOptions, "$column_options must be an instance of ColumnOptions")
        assert(column_settings instanceof ColumnSettings, "$column_settings must be an instance of ColumnSettings")
        assert(is_array(initial_statuses), "$initial_statuses must be of type array")
        assert(is_string(target), "$target must be of type string")
        const settings = get_desktop_settings()
        if (settings.multiple_columns_enabled === false) {
            if (type === enums.column.type.home) {
                const { server, user } = params
                assert(is_object(server), "$server must be of type object")
                assert(is_object(user), "$user must be of type object")
                return location.href = `/server/${server.name}/@${user.name}`
            }
            if (type === enums.column.type.server) {
                const { server } = params
                assert(is_object(server), "$server must be of type object")
                return location.href = `/server/${server.name}/statuses`
            }
            if (type === enums.column.type.channel) {
                const { server, channel } = params
                assert(is_object(server), "$server must be of type object")
                assert(is_object(channel), "$channel must be of type object")
                return location.href = `/server/${server.name}/${channel.name}`
            }
            if (type === enums.column.type.thread) {
                const { status } = params
                assert(is_object(status), "$status must be of type object")
                const { server } = status
                assert(is_object(server), "$server must be of type object")
                return location.href = `/server/${server.name}/thread/${status.id}`
            }
            if (type === enums.column.type.notifications) {
                const { server } = params
                assert(is_object(server), "$server must be of type object")
                return location.href = `/server/${server.name}/notifications`
            }
        }

        const column = (() => {
            if (target === enums.column.target.new) {
                for (const column of this.columns) {	// 一度開いたカラムに上書き
                    if (column.target === enums.column.target.new) {
                        column.push(type, params, column_options, initial_statuses)
                        return column
                    }
                }
                // ない場合は2番目のカラムに上書き
                if (this.columns.length >= 2) {
                    const column = this.columns[1]
                    column.push(type, params, column_options, initial_statuses)
                    return column
                }
            }

            // 新しいカラムを作る
            const { muted_users, muted_words } = this.props
            const column = new ColumnStore(target, column_settings, muted_users, muted_words)
            column.push(type, params, column_options, initial_statuses)

            if (this.columns.length === 0) {
                this.columns.push(column)
                return column
            }
            if (!!source_column === false) {
                this.columns.push(column)
                return column
            }

            // 新しいカラムはそれが開かれたカラムの右隣に追加する
            assert(source_column instanceof ColumnStore, "$source_column must be an instance of ColumnStore")
            let insert_index = 0
            for (const column of this.columns) {
                if (column.identifier === source_column.identifier) {
                    break
                }
                insert_index += 1
            }
            this.columns.splice(insert_index + 1, 0, column)
            return column
        })()
        this.serialize()
        return column
    }
    @action.bound
    onClose = identifier => {
        const is_closed = (() => {
            for (let i = 0; i < this.columns.length; i++) {
                const column = this.columns[i]
                if (column.identifier === identifier) {
                    if (column.options.is_closable) {
                        this.columns.splice(i, 1)
                        return true
                    } else {
                        alert("このカラムは閉じることができません")
                        return false
                    }
                }
            }
            return false
        })()
        if (is_closed) {
            this.serialize()
        }
    }
    componentDidUpdate = () => {
        if (this.callback_change) {
            this.callback_change()
        }
    }
    onClickChannel = (event, source_column) => {
        const desktop_settings = get_desktop_settings()
        if (desktop_settings.multiple_columns_enabled === false) {
            return true
        }
        event.preventDefault()

        const { server } = this.props
        assert(is_object(server), "$server must be of type object")

        const name = event.target.getAttribute("data-name")
        assert(is_string(name), "$name must be of type string")

        for (let j = 0; j < this.columns.length; j++) {
            const column = this.columns[j]
            if (column.type !== enums.column.type.channel) {
                continue
            }
            if (column.params.channel.name === name) {
                alert("すでに開いています")
                return
            }
        }

        request
            .get("/channel/show", { name, "server_id": server.id })
            .then(res => {
                const data = res.data
                const { channel, success } = data
                if (success === false) {
                    alert(data.error)
                    return
                }
                if (!!channel === false) {
                    alert("チャンネルが見つかりません")
                    return
                }

                const { muted_users, muted_words } = this.props
                const column_options = new ColumnOptions()
                const opt = new TimelineOptions()
                opt.muted_users = muted_users
                opt.muted_words = muted_words
                opt.has_newer_statuses = false
                opt.has_older_statuses = true
                column_options.timeline = opt

                const column_settings = new ColumnSettings()

                this.open(enums.column.type.channel,
                    { channel, server },
                    column_options,
                    column_settings,
                    [],
                    desktop_settings.new_column_target,
                    source_column)
            })
            .catch(error => {
                alert(error)
            })
    }
    onClickMention = (event, source_column) => {
        const settings = get_desktop_settings()
        if (settings.multiple_columns_enabled === false) {
            return true
        }
        event.preventDefault()

        const { server } = this.props
        assert(is_object(server), "$server must be of type object")

        const name = event.target.getAttribute("data-name")
        assert(is_string(name), "$name must be of type string")

        for (let i = 0; i < this.columns.length; i++) {
            const column = this.columns[i]
            if (column.type !== enums.column.type.home) {
                continue
            }
            if (column.params.user.name === name) {
                alert("すでに開いています")
                throw new Error()
            }
        }

        request
            .get("/user/show", { name })
            .then(res => {
                const data = res.data
                const { user, success } = data
                if (success == false) {
                    alert(data.error)
                    return
                }
                if (!!user === false) {
                    alert("ユーザーが見つかりません")
                    return
                }

                const { muted_users, muted_words } = this.props
                const column_options = new ColumnOptions()
                const opt = new TimelineOptions()
                opt.muted_users = muted_users
                opt.muted_words = muted_words
                opt.has_newer_statuses = false
                opt.has_older_statuses = true
                column_options.timeline = opt

                const column_settings = new ColumnSettings()

                this.open(enums.column.type.home,
                    { user, server },
                    column_options,
                    column_settings,
                    [],
                    settings.new_column_target,
                    source_column)
            })
            .catch(error => {
                alert(error)
            })
    }
    onClickThread = (event, source_column, in_reply_to_status_id) => {
        const settings = get_desktop_settings()
        if (settings.multiple_columns_enabled === false) {
            return true
        }
        event.preventDefault()

        const { server } = this.props
        assert(is_object(server), "$server must be of type object")

        assert(is_string(in_reply_to_status_id), "$in_reply_to_status_id must be of type string")

        for (let i = 0; i < this.columns.length; i++) {
            const column = this.columns[i]
            if (column.type !== enums.column.type.thread) {
                continue
            }
            if (column.params.in_reply_to_status.id === in_reply_to_status_id) {
                alert("すでに開いています")
                throw new Error()
            }
        }

        request
            .get("/status/show", {
                "id": in_reply_to_status_id,
                "trim_user": false,
                "trim_server": false,
                "trim_channel": false,
                "trim_recipient": false,
                "trim_favorited_by": false,
                "trim_commenters": false
            })
            .then(res => {
                const data = res.data
                const { status, success } = data
                if (success == false) {
                    alert(data.error)
                    return
                }
                if (!!status === false) {
                    alert("スレッドが見つかりません")
                    return
                }

                const { muted_users, muted_words } = this.props
                const column_options = new ColumnOptions()
                const opt = new TimelineOptions()
                opt.muted_users = muted_users
                opt.muted_words = muted_words
                opt.has_newer_statuses = false
                opt.has_older_statuses = true
                column_options.timeline = opt

                const column_settings = new ColumnSettings()

                this.open(enums.column.type.thread,
                    { "in_reply_to_status": status, "server": server },
                    column_options,
                    column_settings,
                    [],
                    settings.new_column_target,
                    source_column)
            })
            .catch(error => {
                alert(error)
            })
    }
    render() {
        const { server, joined_channels, logged_in_user, request_query, pinned_media, recent_uploads } = this.props
        const columnViews = []
        this.columns.forEach(column => {
            columnViews.push(
                <ColumnView
                    key={column.identifier}
                    column={column}
                    server={server}
                    logged_in_user={logged_in_user}
                    pinned_media={pinned_media}
                    recent_uploads={recent_uploads}
                    request_query={request_query}
                    handle_close={this.onClose}
                    handle_click_channel={this.onClickChannel}
                    handle_click_mention={this.onClickMention}
                    handle_click_thread={this.onClickThread} />
            )
        })
        return (
            <div className="inside column-container">
                <div className="column channels">
                    <JoinedHashtagsListView
                        channels={joined_channels}
                        server={server}
                        handle_click_channel={this.onClickChannel} />
                </div>
                {columnViews}
                <div className="column server">
                    <ServerDetailView
                        server={server}
                        handle_click_channel={this.onClickChannel}
                        handle_click_mention={this.onClickMention}
                        handle_click_thread={this.onClickThread}
                        is_members_hidden={false}
                        ellipsis_description={true}
                        collapse_members={true} />
                </div>
            </div>
        )
    }
}

@observer
class ColumnView extends Component {
    onClose = event => {
        event.preventDefault()
        const { handle_close, column } = this.props
        assert(is_object(column), "$column must be of type object")
        assert(is_function(handle_close), "$handle_close must be function")
        handle_close(column.identifier)
    }
    onBack = () => {
        event.preventDefault()
        const { column } = this.props
        assert(is_object(column), "$column must be of type object")
        column.pop()
    }
    onClickChannel = event => {
        const { column, handle_click_channel } = this.props
        handle_click_channel(event, column)
    }
    onClickMention = event => {
        const { column, handle_click_mention } = this.props
        handle_click_mention(event, column)
    }
    onClickThread = (event, in_reply_to_status_id) => {
        const { column, handle_click_thread } = this.props
        handle_click_thread(event, column, in_reply_to_status_id)
    }
    loadMoreStatuses = () => {
        const { column } = this.props
        const { timeline } = column
        timeline.more()
    }
    render() {
        const { column, server, logged_in_user, request_query, pinned_media, recent_uploads } = this.props

        const props = {
            "handle_click_channel": this.onClickChannel,
            "handle_click_mention": this.onClickMention,
            "handle_click_thread": this.onClickThread,
            "handle_close": this.onClose,
            "handle_back": this.onBack,
            column, server, logged_in_user, request_query, pinned_media, recent_uploads
        }

        if (column.type === enums.column.type.home) {
            return <HomeColumnView {...props} />
        }
        if (column.type === enums.column.type.server) {
            return <ServerColumnView {...props} />
        }
        if (column.type === enums.column.type.channel) {
            return <ChannelColumnView {...props} />
        }
        if (column.type === enums.column.type.thread) {
            return <ThreadColumnView {...props} />
        }
        if (column.type === enums.column.type.notifications) {
            return <NotificationColumnView {...props} />
        }
        return null
    }
}


@observer
class ThreadColumnView extends Component {
    constructor(props) {
        super(props)
        const { column } = props
        assert(column.type === enums.column.type.thread, "$column.type must be 'thread'")

        const { handle_close, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = props
        assert(is_function(handle_close), "$handle_close must be of type function")
        assert(is_function(handle_back), "$handle_back must be of type function")
        assert(is_function(handle_click_channel), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function")
    }
    render() {
        const { server, column, logged_in_user, pinned_media, recent_uploads, request_query } = this.props
        const { handle_close, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        const { in_reply_to_status } = column.params
        const uploader = new UploadManager()
        const postbox = new PostboxStore(postbox_destinations.thread, column.params)

        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    <ThreadTimelineHeaderView
                        column={column}
                        in_reply_to_status={in_reply_to_status}
                        handle_close={handle_close}
                        handle_back={handle_back} />
                    <div className="content">
                        <div className="vertical-line"></div>
                        <PostboxView
                            postbox={postbox}
                            timeline={column.timeline}
                            logged_in_user={logged_in_user}
                            uploader={uploader}
                            pinned_media={pinned_media}
                            server={server}
                            recent_uploads={recent_uploads} />
                        <TimelineView
                            total_num_statuses={in_reply_to_status.comments_count}
                            in_reply_to_status={in_reply_to_status}
                            logged_in_user={logged_in_user}
                            timeline={column.timeline}
                            request_query={request_query}
                            timeline_options={column.options.timeline}
                            status_options={column.options.status}
                            handle_click_channel={handle_click_channel}
                            handle_click_mention={handle_click_mention}
                            handle_click_thread={handle_click_thread} />
                    </div>
                </div>
            </div>
        )
    }
}

@observer
class HomeColumnView extends Component {
    constructor(props) {
        super(props)
        const { column } = props
        assert(column.type === enums.column.type.home, "$column.type must be 'home'")
    }
    render() {
        const { server, column, logged_in_user, pinned_media, recent_uploads, request_query } = this.props
        const { handle_close, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        const { user } = column.params
        const uploader = new UploadManager()
        const postbox = new PostboxStore(postbox_destinations.home, column.params)
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    <HomeTimelineHeaderView
                        column={column}
                        user={user}
                        handle_close={handle_close}
                        handle_back={handle_back} />
                    <div className="content">
                        <div className="vertical-line"></div>
                        <PostboxView
                            logged_in_user={logged_in_user}
                            uploader={uploader}
                            pinned_media={pinned_media}
                            recent_uploads={recent_uploads}
                            server={server}
                            postbox={postbox}
                            timeline={column.timeline} />
                        <TimelineView
                            logged_in_user={logged_in_user}
                            timeline={column.timeline}
                            request_query={request_query}
                            timeline_options={column.options.timeline}
                            status_options={column.options.status}
                            handle_click_channel={handle_click_channel}
                            handle_click_mention={handle_click_mention}
                            handle_click_thread={handle_click_thread} />
                    </div>
                </div>
            </div>
        )
    }
}

@observer
class ServerColumnView extends Component {
    constructor(props) {
        super(props)
        const { column } = props
        assert(column.type === enums.column.type.server, "$column.type must be 'server'")
        const { handle_close, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        assert(is_function(handle_close), "$handle_close must be of type function")
        assert(is_function(handle_back), "$handle_back must be of type function")
        assert(is_function(handle_click_channel), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function")
    }
    render() {
        const { column, logged_in_user, pinned_media, recent_uploads, request_query } = this.props
        const { handle_close, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        const { server } = column.params
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    <ServerTimelineHeaderView
                        column={column}
                        server={server}
                        handle_close={handle_close}
                        handle_back={handle_back} />
                    <div className="content">
                        <div className="vertical-line"></div>
                        <TimelineView
                            logged_in_user={logged_in_user}
                            timeline={column.timeline}
                            request_query={request_query}
                            timeline_options={column.options.timeline}
                            status_options={column.options.status}
                            handle_click_channel={handle_click_channel}
                            handle_click_mention={handle_click_mention}
                            handle_click_thread={handle_click_thread} />
                    </div>
                </div>
            </div>
        )
    }
}

@observer
class ChannelColumnView extends Component {
    constructor(props) {
        super(props)
        const { column } = props
        const { channel } = column.params
        assert(column.type === enums.column.type.channel, "$column.type must be 'channel'")
        const { handle_close, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        assert(is_function(handle_close), "$handle_close must be of type function")
        assert(is_function(handle_back), "$handle_back must be of type function")
        assert(is_function(handle_click_channel), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function")

        this.state = {
            "pending_join": false,
        }
    }
    onJoin = async event => {
        event.preventDefault()
        const { column } = this.props
        const { channel } = column.params
        if (this.state.pending_join === true) {
            return
        }
        this.setState({
            "pending_join": true
        })
        try {
            const res = await request.post("/channel/join", { "channel_id": channel.id })
            const { data } = res
            if (data.success == false) {
                throw new Error(data.error)
            }
            channel.joined = true
        } catch (error) {
            alert(error)
        }
        this.setState({
            "pending_join": false
        })
    }
    render() {
        const { server, column, logged_in_user, pinned_media, recent_uploads, request_query } = this.props
        const { handle_close, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        const { channel } = column.params
        const uploader = new UploadManager()
        const postbox = new PostboxStore(postbox_destinations.channel, column.params)
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    <HashtagTimelineHeaderView
                        column={column}
                        channel={channel}
                        server={server}
                        handle_close={handle_close}
                        handle_back={handle_back} />
                    {(channel.invitation_needed !== true || channel.joined) ? null :
                        <div className="timeline-join">
                            <p className="hint">このチャンネルは承認制です</p>
                        </div>
                    }
                    {(channel.invitation_needed || channel.joined) ? null :
                        <div className="timeline-join">
                            <p className="hint">このチャンネルに参加すると投稿することができます</p>
                            <div className="submit">
                                <button
                                    className={classnames("button meiryo ready user-defined-bg-color", { "in-progress": this.state.pending_join })}
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
                        <div className="vertical-line"></div>
                        {channel.joined === false ? null :
                            <PostboxView
                                postbox={postbox}
                                timeline={column.timeline}
                                logged_in_user={logged_in_user}
                                uploader={uploader}
                                pinned_media={pinned_media}
                                server={server}
                                recent_uploads={recent_uploads} />
                        }
                        <TimelineView
                            logged_in_user={logged_in_user}
                            timeline={column.timeline}
                            request_query={request_query}
                            timeline_options={column.options.timeline}
                            status_options={column.options.status}
                            handle_click_channel={handle_click_channel}
                            handle_click_mention={handle_click_mention}
                            handle_click_thread={handle_click_thread} />
                    </div>
                </div>
            </div>
        )
    }
}

@observer
class NotificationColumnView extends Component {
    constructor(props) {
        super(props)
        const { column } = props
        assert(column.type === enums.column.type.notifications, "$column.type must be 'notifications'")

        const { handle_close, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = props
        assert(is_function(handle_close), "$handle_close must be of type function")
        assert(is_function(handle_back), "$handle_back must be of type function")
        assert(is_function(handle_click_channel), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function")
    }
    render() {
        const { server, column, logged_in_user, pinned_media, recent_uploads, request_query } = this.props
        const { handle_close, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        const uploader = new UploadManager()
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    <div className="content">
                        <div className="vertical-line"></div>
                        <TimelineView
                            logged_in_user={logged_in_user}
                            timeline={column.timeline}
                            request_query={request_query}
                            timeline_options={column.options.timeline}
                            status_options={column.options.status}
                            handle_click_channel={handle_click_channel}
                            handle_click_mention={handle_click_mention}
                            handle_click_thread={handle_click_thread} />
                    </div>
                </div>
            </div>
        )
    }
}