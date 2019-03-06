import { Component } from "react"
// import { observable, action } from "mobx"
// import { observer } from "mobx-react"
import { observable, observer, action } from "../../../../stores/theme/default/common/mobx"
import classnames from "classnames"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import assert, { is_object, is_array, is_string, is_function, is_number } from "../../../../assert"
import { ColumnStore, ColumnOptions, ColumnSettings } from "../../../../stores/theme/default/desktop/column"
import StatusComponent from "./status"
import PostboxComponent from "./postbox"
import { TimelineComponent, StatusGroupTimelineComponent } from "./timeline"
import HomeTimelineHeaderComponent from "./header/timeline/home"
import ChannelTimelineHeaderComponent from "./header/timeline/channel"
import ThreadTimelineHeaderComponent from "./header/timeline/thread"
import CommunityTimelineHeaderComponent from "./header/timeline/community"
import NotificationsTimelineHeaderComponent from "./header/timeline/notifications"
import JoinedChannelsListComponent from "../../../../views/theme/default/desktop/column/channels"
import CommunityDetailComponent from "../../../../views/theme/default/desktop/column/community"
import { request } from "../../../../api"
import UploadManager from "../../../../stores/theme/default/common/uploader"
import StatusStore from "../../../../stores/theme/default/common/status"
import PostboxStore from "../../../../stores/theme/default/common/postbox"
import { get as get_desktop_settings } from "../../../../settings/desktop"
import { TimelineOptions } from "../../../../stores/theme/default/desktop/timeline"

const default_column_width = 650

@observer
export class MultipleColumnsContainerComponent extends Component {
    @observable.shallow columns = []
    constructor(props) {
        super(props)
        this.state = {
            "expanded": false,
            "column_width": default_column_width
        }
        if (typeof window !== "undefined") {
            window.addEventListener("resize", event => {
                if (this.resize_time_id) {
                    clearTimeout(this.resize_time_id)
                }
                this.resize_time_id = setTimeout(() => {
                    this.adjustColumnWidth()
                }, 100)
            });
        }
        this.initializeColumns()
    }
    generateColumnOptionsWithType = (type, params) => {
        const column_options = new ColumnOptions()
        if (type === enums.column.type.community) {
            column_options.status.show_source_link = true
            column_options.status.trim_comments = true
            column_options.postbox.is_hidden = true
        } else if (type === enums.column.type.notifications) {
            column_options.status.show_source_link = true
            column_options.status.trim_comments = true
            column_options.postbox.is_hidden = true
        } else if (type === enums.column.type.channel) {
            if (params.channel.joined === false) {
                column_options.postbox.is_hidden = true
            }
        } else if (type === enums.column.type.thread) {
            column_options.status.show_source_link = false
            column_options.status.trim_comments = false
        }
        return column_options
    }
    initializeColumns = () => {
        const { community, logged_in_user, columns, channel, callback_change,
            muted_users, muted_words, request_query, has_newer_statuses, has_older_statuses } = this.props
        assert(is_object(logged_in_user), "$logged_in_user must be of type object")
        assert(is_array(columns), "$columns must be of type array")
        assert(is_array(muted_users), "$muted_users must be of type array")
        assert(is_array(muted_words), "$muted_words must be of type array")
        if (callback_change) {
            assert(is_function(callback_change), "$callback_change must be of type function")
            this.callback_change = callback_change
        }
        const desktop_settings = get_desktop_settings()
        if (desktop_settings.multiple_columns_enabled) {
            for (let column_index = 0; column_index < columns.length; column_index++) {
                const column = columns[column_index]
                const { type, params, statuses } = column

                assert(is_object(params), "$params must be of type object")
                assert(is_array(statuses), "$statuses must be of type array")
                assert(is_string(type), "$type must be of type string")

                const column_options = this.generateColumnOptionsWithType(type, params)
                if (column_index == 0) {
                    column_options.is_closable = false
                    column_options.timeline.has_newer_statuses = has_newer_statuses
                    column_options.timeline.has_older_statuses = has_older_statuses
                    if (has_newer_statuses) {
                        column_options.timeline.auto_reloading_enabled = false
                    }
                } else {
                    column_options.timeline.has_older_statuses = true
                }
                column_options.timeline.muted_users = muted_users
                column_options.timeline.muted_words = muted_words

                const column_settings = new ColumnSettings()

                this.insert(type, params,
                    column_options,
                    column_settings,
                    statuses,
                    enums.column.target.blank,
                    -1,
                    muted_users,
                    muted_words
                )
            }
        } else {
            assert(columns.length === 1, "length of $columns must be 1")
            const column = columns[0]
            const { type, params, statuses } = column
            const column_options = this.generateColumnOptionsWithType(type, params)

            column_options.timeline.has_newer_statuses = has_newer_statuses
            column_options.timeline.has_older_statuses = has_older_statuses
            if (has_newer_statuses) {
                column_options.timeline.auto_reloading_enabled = false
            }
            column_options.timeline.muted_users = muted_users
            column_options.timeline.muted_words = muted_words

            const column_settings = new ColumnSettings()
            
            this.insert(type, params,
                column_options,
                column_settings,
                statuses,
                enums.column.target.blank,
                -1,
                muted_users,
                muted_words
            )
        }
    }
    adjustColumnWidth = () => {
        const column_width = this.computeColumnWidth()
        this.setState({ column_width })
    }
    componentDidMount = () => {
        this.adjustColumnWidth()
    }
    computeColumnWidth = () => {
        if (typeof document === "undefined") {
            return default_column_width
        }
        const { expanded } = this.state
        const columns = document.getElementsByClassName("column-component")
        const window_width = window.innerWidth
        const padding = 10
        let rest_width = 0
        for (let j = 0; j < columns.length; j++) {
            const dom = columns[j]
            if (dom.className.indexOf("timeline") !== -1) {
                continue
            }
            // computeColumnWidthはrender前に呼ばれるのでdom自体は以前のまま
            if (expanded === false) {
                rest_width += dom.clientWidth + padding
            }
        }
        const column_width = ((window_width - rest_width - padding) / this.columns.length) - padding
        const max_width = expanded ? window.innerWidth : default_column_width
        return Math.max(310, Math.min(max_width, column_width))
    }
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
        if (a.params.community && b.params.community) {
            if (a.params.community.id === b.params.community.id) {
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
            if (type === enums.column.type.community) {
                const { community } = params
                param_ids.community_id = community.id
            }
            if (type === enums.column.type.message) {
                const { community, user } = params
                param_ids.community_id = community.id
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
    insert = (type, params, column_options, column_settings, initial_statuses, target, insert_position, muted_users, muted_words) => {
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
        this.adjustColumnWidth()
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
            if (type === enums.column.type.message) {
                const { community, user } = params
                // assert(is_object(community), "$community must be of type object")
                assert(is_object(user), "$user must be of type object")
                return location.href = `/${community.name}/@${user.name}`
            }
            if (type === enums.column.type.community) {
                const { community } = params
                // assert(is_object(community), "$community must be of type object")
                return location.href = `/${community.name}/statuses`
            }
            if (type === enums.column.type.channel) {
                const { community, channel } = params
                // assert(is_object(community), "$community must be of type object")
                assert(is_object(channel), "$channel must be of type object")
                return location.href = `/${community.name}/${channel.name}`
            }
            if (type === enums.column.type.thread) {
                const { status } = params
                assert(is_object(status), "$status must be of type object")
                // const { community } = status
                // assert(is_object(community), "$community must be of type object")
                return location.href = `/thread/${status.id}`
            }
            if (type === enums.column.type.notifications) {
                const { community } = params
                // assert(is_object(community), "$community must be of type object")
                return location.href = `/${community.name}/notifications`
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
        this.adjustColumnWidth()
        return column
    }
    expand = () => {
        this.should_adjust_column_width = true
        this.setState({
            "expanded": !this.state.expanded
        })
    }
    @action.bound
    close = identifier => {
        const is_closed = (() => {
            for (let i = 0; i < this.columns.length; i++) {
                const column = this.columns[i]
                if (column.identifier === identifier) {
                    console.log(column.options)
                    if (column.options.is_closable) {
                        const { timeline } = column
                        timeline.terminate()
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
            this.adjustColumnWidth()
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
        const { community } = this.props
        if (!!community === false) {
            return true
        }

        event.preventDefault()

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
            .get("/channel/show", { name, "community_id": community.id })
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
                    { channel, community },
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

        const name = event.target.getAttribute("data-name")
        assert(is_string(name), "$name must be of type string")

        for (let i = 0; i < this.columns.length; i++) {
            const column = this.columns[i]
            if (column.type !== enums.column.type.message) {
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

                this.open(enums.column.type.message,
                    { user },
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

        // const { community } = this.props
        // assert(is_object(community), "$community must be of type object")

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
                "trim_community": false,
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
                    { "in_reply_to_status": status },
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
    componentDidUpdate = () => {
        if (this.should_adjust_column_width) {
            this.adjustColumnWidth()
            this.should_adjust_column_width = false
        }
    }
    render = () => {
        console.log("[columns] render")
        const { community, joined_channels, logged_in_user, request_query, pinned_media, recent_uploads } = this.props
        const columnComponents = []
        this.columns.forEach(column => {
            columnComponents.push(
                <ColumnComponent
                    key={column.identifier}
                    column={column}
                    community={community}
                    width={this.state.column_width}
                    logged_in_user={logged_in_user}
                    pinned_media={pinned_media}
                    recent_uploads={recent_uploads}
                    request_query={request_query}
                    handle_close={this.close}
                    handle_expand={this.expand}
                    handle_click_channel={this.onClickChannel}
                    handle_click_mention={this.onClickMention}
                    handle_click_thread={this.onClickThread} />
            )
        })
        const desktop_settings = get_desktop_settings()
        return (
            <div className={classnames("inside multiple-columns-component", {
                "multiple-columns-enabled": desktop_settings.multiple_columns_enabled
            })}>
                {this.state.expanded ? null :
                    <div className="column-component channels">
                        <JoinedChannelsListComponent
                            channels={joined_channels}
                            community={community}
                            handle_click_channel={this.onClickChannel} />
                    </div>
                }
                {columnComponents}
                {this.state.expanded ? null :
                    <div className="column-component community-overview">
                        <CommunityDetailComponent
                            community={community}
                            logged_in_user={logged_in_user}
                            handle_click_channel={this.onClickChannel}
                            handle_click_mention={this.onClickMention}
                            handle_click_thread={this.onClickThread} />
                    </div>
                }
            </div>
        )
    }
}

@observer
class ColumnComponent extends Component {
    constructor(props) {
        super(props)
        this.uploader = new UploadManager()
    }
    onExpand = event => {
        event.preventDefault()
        const { handle_expand } = this.props
        assert(is_function(handle_expand), "$handle_expand must be function")
        handle_expand()
    }
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
        const { column, community, logged_in_user, request_query, pinned_media, recent_uploads, width } = this.props

        const props = {
            "handle_click_channel": this.onClickChannel,
            "handle_click_mention": this.onClickMention,
            "handle_click_thread": this.onClickThread,
            "handle_expand": this.onExpand,
            "handle_close": this.onClose,
            "handle_back": this.onBack,
            "uploader": this.uploader,
            column, community, logged_in_user, request_query,
            pinned_media, recent_uploads, width
        }

        if (column.type === enums.column.type.message) {
            return <HomeColumnComponent {...props} />
        }
        if (column.type === enums.column.type.community) {
            return <CommunityStatusesColumnComponent {...props} />
        }
        if (column.type === enums.column.type.channel) {
            return <ChannelColumnComponent {...props} />
        }
        if (column.type === enums.column.type.thread) {
            return <ThreadColumnComponent {...props} />
        }
        if (column.type === enums.column.type.notifications) {
            return <NotificationColumnComponent {...props} />
        }
        return null
    }
}


@observer
class ThreadColumnComponent extends Component {
    constructor(props) {
        super(props)
        const { column } = props
        assert(column.type === enums.column.type.thread, "$column.type must be 'thread'")

        const { handle_close, handle_expand, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = props
        assert(is_function(handle_close), "$handle_close must be of type function")
        assert(is_function(handle_expand), "$handle_expand must be of type function")
        assert(is_function(handle_back), "$handle_back must be of type function")
        assert(is_function(handle_click_channel), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function")

        const { in_reply_to_status } = column.params
        assert(is_object(in_reply_to_status), "$in_reply_to_status must be of type object")
        this.postbox = new PostboxStore({
            "in_reply_to_status_id": in_reply_to_status.id
        })
    }
    render() {
        const { community, column, uploader, logged_in_user, pinned_media, recent_uploads, request_query, width } = this.props
        const { handle_close, handle_expand, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        const { in_reply_to_status } = column.params
        const is_narrow_column = width < 400

        return (
            <div className={classnames("column-component timeline", {
                "narrow": is_narrow_column
            })} style={{ "width": `${width}px` }}>
                <div className="inside round">
                    <ThreadTimelineHeaderComponent
                        timeline={column.timeline}
                        in_reply_to_status={in_reply_to_status}
                        handle_close={handle_close}
                        handle_expand={handle_expand}
                        handle_back={handle_back} />
                    <div className="contents">
                        <PostboxComponent
                            postbox={this.postbox}
                            timeline={column.timeline}
                            logged_in_user={logged_in_user}
                            uploader={uploader}
                            pinned_media={pinned_media}
                            community={community}
                            recent_uploads={recent_uploads} />
                        <TimelineComponent
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
class HomeColumnComponent extends Component {
    constructor(props) {
        super(props)
        const { column } = props
        assert(column.type === enums.column.type.message, "$column.type must be 'home'")

        const { recipient } = params
        assert(is_object(recipient), "$recipient must be of type object")
        this.postbox = new PostboxStore({
            "recipient_id": recipient.id
        })
    }
    render() {
        const { community, column, uploader, logged_in_user, pinned_media, recent_uploads, request_query, width } = this.props
        const { handle_close, handle_expand, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        const { user } = column.params
        const is_narrow_column = width < 400
        return (
            <div className={classnames("column-component timeline", {
                "narrow": is_narrow_column
            })} style={{ "width": `${width}px` }}>
                <div className="inside round">
                    <HomeTimelineHeaderComponent
                        column={column}
                        user={user}
                        logged_in_user={logged_in_user}
                        handle_close={handle_close}
                        handle_expand={handle_expand}
                        handle_back={handle_back} />
                    <div className="contents">
                        <PostboxComponent
                            logged_in_user={logged_in_user}
                            uploader={uploader}
                            pinned_media={pinned_media}
                            recent_uploads={recent_uploads}
                            community={community}
                            postbox={this.postbox}
                            timeline={column.timeline} />
                        <TimelineComponent
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
class ChannelColumnComponent extends Component {
    constructor(props) {
        super(props)
        const { column } = props
        const { channel } = column.params
        assert(column.type === enums.column.type.channel, "$column.type must be 'channel'")
        const { handle_close, handle_expand, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        assert(is_function(handle_close), "$handle_close must be of type function")
        assert(is_function(handle_expand), "$handle_expand must be of type function")
        assert(is_function(handle_back), "$handle_back must be of type function")
        assert(is_function(handle_click_channel), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function")

        assert(is_object(channel), "$channel must be of type object")
        this.postbox = new PostboxStore({
            "channel_id": channel.id
        })
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
        const { community, column, uploader, logged_in_user, pinned_media, recent_uploads, request_query, width } = this.props
        const { handle_close, handle_expand, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        const { channel } = column.params
        const is_narrow_column = width < 400
        return (
            <div className={classnames("column-component timeline", {
                "narrow": is_narrow_column
            })} style={{ "width": `${width}px` }}>
                <div className="inside round">
                    <ChannelTimelineHeaderComponent
                        timeline={column.timeline}
                        channel={channel}
                        community={community}
                        handle_close={handle_close}
                        handle_expand={handle_expand}
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
                                    location.href = `/${channel.name}`
                                }}>
                                    <span className="display-text">詳細を見る</span>
                                </button>
                            </div>
                        </div>
                    }
                    <div className={classnames("contents", {
                        "postobx-hidden": !channel.joined
                    })}>
                        {channel.joined === false ? null :
                            <PostboxComponent
                                postbox={this.postbox}
                                timeline={column.timeline}
                                logged_in_user={logged_in_user}
                                uploader={uploader}
                                pinned_media={pinned_media}
                                community={community}
                                recent_uploads={recent_uploads} />
                        }
                        <TimelineComponent
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
class CommunityStatusesColumnComponent extends Component {
    constructor(props) {
        super(props)
        const { column } = props
        assert(column.type === enums.column.type.community, "$column.type must be 'community'")
        const { handle_close, handle_expand, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        assert(is_function(handle_close), "$handle_close must be of type function")
        assert(is_function(handle_expand), "$handle_expand must be of type function")
        assert(is_function(handle_back), "$handle_back must be of type function")
        assert(is_function(handle_click_channel), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function")
    }
    render() {
        const { column, logged_in_user, pinned_media, recent_uploads, request_query, width } = this.props
        const { handle_close, handle_expand, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        const { community } = column.params
        const is_narrow_column = width < 400
        return (
            <div className={classnames("column-component timeline", {
                "narrow": is_narrow_column
            })} style={{ "width": `${width}px` }}>
                <div className="inside round">
                    <CommunityTimelineHeaderComponent
                        timeline={column.timeline}
                        community={community}
                        handle_expand={handle_expand}
                        handle_close={handle_close}
                        handle_back={handle_back} />
                    <div className="contents postbox-hidden">
                        <StatusGroupTimelineComponent
                            logged_in_user={logged_in_user}
                            timeline={column.timeline}
                            request_query={request_query}
                            timeline_options={column.options.timeline}
                            status_options={column.options.status}
                            community={community}
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
class NotificationColumnComponent extends Component {
    constructor(props) {
        super(props)
        const { column } = props
        assert(column.type === enums.column.type.notifications, "$column.type must be 'notifications'")

        const { handle_close, handle_expand, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = props
        assert(is_function(handle_close), "$handle_close must be of type function")
        assert(is_function(handle_expand), "$handle_expand must be of type function")
        assert(is_function(handle_back), "$handle_back must be of type function")
        assert(is_function(handle_click_channel), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function")
        assert(is_function(handle_click_thread), "$handle_click_thread must be of type function")
    }
    render() {
        const { community, column, logged_in_user, pinned_media, recent_uploads, request_query, width } = this.props
        const { handle_close, handle_expand, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        const is_narrow_column = width < 400
        return (
            <div className={classnames("column-component timeline", {
                "narrow": is_narrow_column
            })} style={{ "width": `${width}px` }}>
                <div className="inside round">
                    <NotificationsTimelineHeaderComponent
                        timeline={column.timeline}
                        handle_expand={handle_expand}
                        handle_close={handle_close}
                        handle_back={handle_back} />
                    <div className="contents postbox-hidden">
                        <StatusGroupTimelineComponent
                            logged_in_user={logged_in_user}
                            timeline={column.timeline}
                            request_query={request_query}
                            timeline_options={column.options.timeline}
                            status_options={column.options.status}
                            only_merge_thread={true}
                            community={community}
                            handle_click_channel={handle_click_channel}
                            handle_click_mention={handle_click_mention}
                            handle_click_thread={handle_click_thread} />
                    </div>
                </div>
            </div>
        )
    }
}