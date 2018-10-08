import { Component } from "react"
import { observable, action } from "mobx"
import { observer } from "mobx-react"
import classnames from "classnames"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import assert, { is_object, is_array, is_string, is_function, is_number } from "../../../../assert"
import { ColumnStore } from "../../../../stores/theme/default/desktop/column"
import StatusView from "./status"
import PostboxView from "./postbox"
import TimelineView from "./timeline"
import HomeTimelineHeaderView from "./timeline/header/home"
import HashtagTimelineHeaderView from "./timeline/header/hashtag"
import ThreadTimelineHeaderView from "./timeline/header/thread"
import ServerTimelineHeaderView from "./timeline/header/server"
import JoinedHashtagsListView from "../../../../views/theme/default/desktop/column/hashtags"
import ServerDetailView from "../../../../views/theme/default/desktop/column/server"
import { request } from "../../../../api"
import UploadManager from "../../../../stores/theme/default/common/uploader"
import StatusStore from "../../../../stores/theme/default/common/status"
import PostboxStore, { destinations as postbox_destinations } from "../../../../stores/theme/default/common/postbox"
import { get_current_settings } from "../../../../settings/desktop"

@observer
export class MultipleColumnsContainerView extends Component {
    @observable.shallow columns = []
    equals = (a, b) => {
        assert(is_object(a), "$a must be of type object")
        assert(is_object(b), "$b must be of type object")
        if (a.type !== b.type) {
            return false
        }
        if (a.params.hashtag && b.params.hashtag) {
            if (a.params.hashtag.tagname === b.params.hashtag.tagname) {
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
            if (type === enums.column.type.hashtag) {
                const { hashtag } = params
                param_ids.hashtag_id = hashtag.id
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
    // insert_position	この位置の左隣に追加する
    @action.bound
    insert(type, params, options, initial_statuses, target, insert_position) {
        assert(is_object(params), "$params must be of type object")
        assert(is_object(options), "$options must be of type object")
        assert(is_array(initial_statuses), "$initial_statuses must be of type array")
        assert(is_number(insert_position), "$insert_position must be of type number")
        const settings = get_current_settings()
        target = target || settings.new_column_target
        const column = new ColumnStore(target)
        column.push(type, params, options, initial_statuses)
        if (insert_position === -1) {
            this.columns.push(column)
        } else {
            this.columns.splice(insert_position, 0, column)
        }
        return column
    }
    // ユーザー操作で追加
    @action.bound
    open = (type, params, options, initial_statuses, target, source_column) => {
        assert(is_string(type), "$type must be of type string")
        assert(is_object(params), "$params must be of type object")
        assert(is_object(options), "$options must be of type object")
        assert(is_array(initial_statuses), "$initial_statuses must be of type array")
        assert(is_string(target), "$target must be of type string")
        const settings = get_current_settings()
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
            if (type === enums.column.type.hashtag) {
                const { server, hashtag } = params
                assert(is_object(server), "$server must be of type object")
                assert(is_object(hashtag), "$hashtag must be of type object")
                return location.href = `/server/${server.name}/${hashtag.tagname}`
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
                        column.push(type, params, options, initial_statuses)
                        return column
                    }
                }
                // ない場合は2番目のカラムに上書き
                if (this.columns.length >= 2) {
                    const column = this.columns[1]
                    column.push(type, params, options, initial_statuses)
                    return column
                }
            }

            // 新しいカラムを作る
            const column = new ColumnStore(target)
            column.push(type, params, options, initial_statuses)

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
    onClickHashtag = (event, source_column) => {
        const settings = get_current_settings()
        if (settings.multiple_columns_enabled === false) {
            return true
        }
        event.preventDefault()

        const { server } = this.props
        assert(is_object(server), "$server must be of type object")

        const tagname = event.target.getAttribute("data-tagname")
        assert(is_string(tagname), "$tagname must be of type string")

        for (let i = 0; i < this.columns.length; i++) {
            const column = this.columns[i]
            if (column.type !== enums.column.type.hashtag) {
                continue
            }
            if (column.params.hashtag.tagname === tagname) {
                alert("すでに開いています")
                return
            }
        }

        request
            .get("/hashtag/show", { tagname, "server_id": server.id })
            .then(res => {
                const data = res.data
                const { hashtag, success } = data
                if (success === false) {
                    alert(data.error)
                    return
                }
                if (!!hashtag === false) {
                    alert("ルームが見つかりません")
                    return
                }
                this.open(enums.column.type.hashtag,
                    { hashtag, server },
                    {},
                    [],
                    settings.new_column_target,
                    source_column)
            })
            .catch(error => {
                alert(error)
            })
    }
    onClickMention = (event, source_column) => {
        const settings = get_current_settings()
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
                this.open(enums.column.type.home,
                    { user, server },
                    {},
                    [],
                    settings.new_column_target,
                    source_column)
            })
            .catch(error => {
                alert(error)
            })
    }
    onClickThread = (event, source_column, in_reply_to_status_id) => {
        const settings = get_current_settings()
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
                "trim_hashtag": false,
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
                this.open(enums.column.type.thread,
                    { "in_reply_to_status": status, "server": server },
                    {},
                    [],
                    settings.new_column_target,
                    source_column)
            })
            .catch(error => {
                alert(error)
            })
    }
    render() {
        const { server, joined_hashtags, logged_in, request_query, pinned_media, recent_uploads } = this.props
        const columnViews = []
        this.columns.forEach(column => {
            columnViews.push(
                <ColumnView
                    key={column.identifier}
                    column={column}
                    server={server}
                    logged_in={logged_in}
                    pinned_media={pinned_media}
                    recent_uploads={recent_uploads}
                    request_query={request_query}
                    handle_close={this.onClose}
                    handle_click_hashtag={this.onClickHashtag}
                    handle_click_mention={this.onClickMention}
                    handle_click_thread={this.onClickThread} />
            )
        })
        return (
            <div className="inside column-container">
                <div className="column hashtags">
                    <JoinedHashtagsListView
                        hashtags={joined_hashtags}
                        server={server}
                        handle_click_hashtag={this.onClickHashtag} />
                </div>
                {columnViews}
                <div className="column server">
                    <ServerDetailView
                        server={server}
                        handle_click_hashtag={this.onClickHashtag}
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
    onClickHashtag = event => {
        const { column, handle_click_hashtag } = this.props
        handle_click_hashtag(event, column)
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
        const { column, server, logged_in, request_query, pinned_media, recent_uploads } = this.props

        const props = {
            "handle_click_hashtag": this.onClickHashtag,
            "handle_click_mention": this.onClickMention,
            "handle_click_thread": this.onClickThread,
            "handle_close": this.onClose,
            "handle_back": this.onBack,
            column, server, logged_in, request_query, pinned_media, recent_uploads
        }

        if (column.type === enums.column.type.home) {
            return <HomeColumnView {...props} />
        }
        if (column.type === enums.column.type.server) {
            return <ServerColumnView {...props} />
        }
        if (column.type === enums.column.type.hashtag) {
            return <HashtagColumnView {...props} />
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

        const { handle_close, handle_back, handle_click_hashtag, handle_click_mention, handle_click_thread } = props
        assert(is_function(handle_close), "$handle_close must be of type function at ThreadColumnView.constructor")
        assert(is_function(handle_back), "$handle_back must be of type function at ThreadColumnView.constructor")
        assert(is_function(handle_click_hashtag), "$handle_click_hashtag must be of type function at ThreadColumnView.constructor")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function at ThreadColumnView.constructor")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function at ThreadColumnView.constructor")
    }
    render() {
        const { server, column, logged_in, pinned_media, recent_uploads, request_query } = this.props
        const { handle_close, handle_back, handle_click_hashtag, handle_click_mention, handle_click_thread } = this.props
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
                        <div className="vertical"></div>
                        <PostboxView
                            postbox={postbox}
                            logged_in={logged_in}
                            uploader={uploader}
                            pinned_media={pinned_media}
                            recent_uploads={recent_uploads} />
                        <TimelineView
                            total_num_statuses={in_reply_to_status.comments_count}
                            in_reply_to_status={in_reply_to_status}
                            logged_in={logged_in}
                            timeline={column.timeline}
                            request_query={request_query}
                            options={column.options}
                            handle_click_hashtag={handle_click_hashtag}
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
        const { server, column, logged_in, pinned_media, recent_uploads, request_query } = this.props
        const { handle_close, handle_back, handle_click_hashtag, handle_click_mention, handle_click_thread } = this.props
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
                        <div className="vertical"></div>
                        <PostboxView
                            logged_in={logged_in}
                            uploader={uploader}
                            pinned_media={pinned_media}
                            recent_uploads={recent_uploads}
                            postbox={postbox} />
                        <TimelineView
                            logged_in={logged_in}
                            timeline={column.timeline}
                            request_query={request_query}
                            options={column.options}
                            handle_click_hashtag={handle_click_hashtag}
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
        const { handle_close, handle_back, handle_click_hashtag, handle_click_mention, handle_click_thread } = this.props
        assert(is_function(handle_close), "$handle_close must be of type function at ServerColumnView.constructor")
        assert(is_function(handle_back), "$handle_back must be of type function at ServerColumnView.constructor")
        assert(is_function(handle_click_hashtag), "$handle_click_hashtag must be of type function at ServerColumnView.constructor")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function at ServerColumnView.constructor")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function at ServerColumnView.constructor")
    }
    render() {
        const { column, logged_in, pinned_media, recent_uploads, request_query } = this.props
        const { handle_close, handle_back, handle_click_hashtag, handle_click_mention, handle_click_thread } = this.props
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
                        <div className="vertical"></div>
                        <TimelineView
                            logged_in={logged_in}
                            timeline={column.timeline}
                            request_query={request_query}
                            options={column.options}
                            handle_click_hashtag={handle_click_hashtag}
                            handle_click_mention={handle_click_mention}
                            handle_click_thread={handle_click_thread} />
                    </div>
                </div>
            </div>
        )
    }
}

@observer
class HashtagColumnView extends Component {
    constructor(props) {
        super(props)
        const { column } = props
        const { hashtag } = column.params
        assert(column.type === enums.column.type.hashtag, "$column.type must be 'hashtag'")
        const { handle_close, handle_back, handle_click_hashtag, handle_click_mention, handle_click_thread } = this.props
        assert(is_function(handle_close), "$handle_close must be of type function at HashtagColumnView.constructor")
        assert(is_function(handle_back), "$handle_back must be of type function at HashtagColumnView.constructor")
        assert(is_function(handle_click_hashtag), "$handle_click_hashtag must be of type function at HashtagColumnView.constructor")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function at HashtagColumnView.constructor")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function at HashtagColumnView.constructor")
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
        const { handle_close, handle_back, handle_click_hashtag, handle_click_mention, handle_click_thread } = this.props
        const { hashtag } = column.params
        const uploader = new UploadManager()
        const postbox = new PostboxStore(postbox_destinations.hashtag, column.params)
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    <HashtagTimelineHeaderView
                        column={column}
                        hashtag={hashtag}
                        handle_close={handle_close}
                        handle_back={handle_back} />
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
                                postbox={postbox}
                                logged_in={logged_in}
                                uploader={uploader}
                                pinned_media={pinned_media}
                                recent_uploads={recent_uploads} />
                        }
                        <TimelineView
                            logged_in={logged_in}
                            timeline={column.timeline}
                            request_query={request_query}
                            options={column.options}
                            handle_click_hashtag={handle_click_hashtag}
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

        const { handle_close, handle_back, handle_click_hashtag, handle_click_mention, handle_click_thread } = props
        assert(is_function(handle_close), "$handle_close must be of type function at ThreadColumnView.constructor")
        assert(is_function(handle_back), "$handle_back must be of type function at ThreadColumnView.constructor")
        assert(is_function(handle_click_hashtag), "$handle_click_hashtag must be of type function at ThreadColumnView.constructor")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function at ThreadColumnView.constructor")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function at ThreadColumnView.constructor")
    }
    render() {
        const { server, column, logged_in, pinned_media, recent_uploads, request_query } = this.props
        const { handle_close, handle_back, handle_click_hashtag, handle_click_mention, handle_click_thread } = this.props
        const uploader = new UploadManager()
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    <div className="content">
                        <div className="vertical"></div>
                        <TimelineView
                            logged_in={logged_in}
                            timeline={column.timeline}
                            request_query={request_query}
                            options={column.options}
                            handle_click_hashtag={handle_click_hashtag}
                            handle_click_mention={handle_click_mention}
                            handle_click_thread={handle_click_thread} />
                    </div>
                </div>
            </div>
        )
    }
}