import { Component } from "react"
import { observable, observer, action } from "../../../../stores/theme/default/common/mobx"
import classnames from "classnames"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import assert, { is_object, is_array, is_string, is_function, is_number } from "../../../../assert"
import { ColumnStore, ColumnOptions, ColumnSettings } from "../../../../stores/theme/default/desktop/column"
import StatusComponent from "./status"
import PostboxComponent from "./postbox"
import { TimelineComponent, StatusGroupTimelineComponent } from "./timeline"
import MessageTimelineHeaderComponent from "./header/timeline/message"
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
import Toast from "../../../../views/theme/default/desktop/toast"
import { TimelineOptions } from "../../../../stores/theme/default/desktop/timeline"

const default_column_width = 650
const status_trim_params = {
    "trim_user": false,
    "trim_community": false,
    "trim_channel": false,
    "trim_recipient": false,
    "trim_favorited_by": false,
    "trim_reaction_users": false,
    "trim_commenters": false
}

const try_load_channel_by_name = async (name, community_id) => {
    const res = await request.get("/channel/show", { "name": name, "community_id": community_id })
    const { channel, error } = res.data
    if (error) {
        throw new Error(error)
    }
    if (!!channel === false) {
        throw new Error("チャンネルが見つかりません")
    }
    return channel
}

const try_load_status_by_id = async status_id => {
    const res = await request.get("/status/show", Object.assign({ "id": status_id }, status_trim_params))
    const { status, error } = res.data
    if (error) {
        throw new Error(error)
    }
    if (!!status === false) {
        throw new Error("投稿が見つかりません")
    }
    return status
}

const try_load_user_by_name = async name => {
    const res = await request.get("/user/show", { name })
    const { user, error } = res.data
    if (error) {
        throw new Error(error)
    }
    if (!!user === false) {
        throw new Error("ユーザーが見つかりません")
    }
    return user
}

const try_load_channel_timeline = async channel_id => {
    const res = await request.get("/timeline/channel", Object.assign({ channel_id }, status_trim_params))
    const { statuses, error } = res.data
    if (error) {
        throw new Error(error)
    }
    if (is_array(statuses) !== true) {
        throw new Error("$statuses must be of type array")
    }
    return statuses
}

const try_load_thread_timeline = async in_reply_to_status_id => {
    const res = await request.get("/timeline/thread", Object.assign({ in_reply_to_status_id }, status_trim_params))
    const { statuses, error } = res.data
    if (error) {
        throw new Error(error)
    }
    if (is_array(statuses) !== true) {
        throw new Error("$statuses must be of type array")
    }
    return statuses
}

const try_load_message_timeline = async recipient_id => {
    const res = await request.get("/timeline/message", Object.assign({ recipient_id }, status_trim_params))
    const { statuses, error } = res.data
    if (error) {
        throw new Error(error)
    }
    if (is_array(statuses) !== true) {
        throw new Error("$statuses must be of type array")
    }
    return statuses
}

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
                const stored_settings = column.settings

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
                if (is_object(stored_settings)) {
                    Object.keys(column_settings).forEach(key => {
                        if (key in stored_settings) {
                            column_settings[key] = stored_settings[key]
                        }
                    })
                }

                this.insert(type, params,
                    column_options,
                    column_settings,
                    statuses,
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
    serialize = () => {
        const store = []
        for (let i = 0; i < this.columns.length; i++) {
            const column = this.columns[i]
            const { type, params, settings } = column
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
                const { recipient } = params
                param_ids.recipient_id = recipient.id
            }
            if (type === enums.column.type.thread) {
                const { in_reply_to_status } = params
                param_ids.in_reply_to_status_id = in_reply_to_status.id
            }
            store.push({ param_ids, type, settings })
        }
        const { pathname } = location
        const key = `client_default_columns_${pathname}`
        request
            .post("/kvs/store", { "key": key, "value": store })
            .then(res => {
                const { error } = res.data
                if (error == false) {
                    Toast.push(error, false)
                }
            })
            .catch(error => {
                Toast.push(error.toString(), false)
            })
    }
    // 初期カラムを追加
    // @param {string} type
    // @param {object} params
    // @param {ColumnOptions} column_options
    // @param {ColumnSettings} column_settings
    // @param {array} initial_statuses
    // @param {number} insert_position この位置の左隣に追加する
    // @param {array} muted_users
    // @param {array} muted_words
    @action.bound
    insert = (type, params, column_options, column_settings, initial_statuses, insert_position, muted_users, muted_words) => {
        assert(is_object(params), "$params must be of type object")
        assert(column_options instanceof ColumnOptions, "$column_options must be an instance of ColumnOptions")
        assert(column_settings instanceof ColumnSettings, "$column_settings must be an instance of ColumnSettings")
        assert(is_array(muted_users), "$muted_users must be of type array")
        assert(is_array(muted_words), "$muted_words must be of type array")
        assert(is_array(initial_statuses), "$initial_statuses must be of type array")
        assert(is_number(insert_position), "$insert_position must be of type number")
        const { logged_in_user } = this.props
        const settings = get_desktop_settings()
        const column = new ColumnStore(column_settings, muted_users, muted_words, logged_in_user, this.serialize)
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
    // @param {ColumnStore} source_column
    @action.bound
    open = (type, params, column_options, column_settings, initial_statuses, source_column) => {
        assert(is_string(type), "$type must be of type string")
        assert(is_object(params), "$params must be of type object")
        assert(column_options instanceof ColumnOptions, "$column_options must be an instance of ColumnOptions")
        assert(column_settings instanceof ColumnSettings, "$column_settings must be an instance of ColumnSettings")
        assert(is_array(initial_statuses), "$initial_statuses must be of type array")
        const settings = get_desktop_settings()
        if (settings.multiple_columns_enabled === false) {
            if (type === enums.column.type.message) {
                const { recipient } = params
                // assert(is_object(community), "$community must be of type object")
                assert(is_object(recipient), "$recipient must be of type object")
                return location.href = `/@${recipient.name}`
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
            // 新しいカラムを作る
            const { muted_users, muted_words, logged_in_user } = this.props
            const column = new ColumnStore(column_settings, muted_users, muted_words, logged_in_user, this.serialize)
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
            for (let j = 0; j < this.columns.length; j++) {
                const column = this.columns[j]
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
    onClickChannel = async (event, source_column) => {
        const desktop_settings = get_desktop_settings()
        if (desktop_settings.multiple_columns_enabled === false) {
            return true
        }
        const { community } = this.props
        if (!!community === false) {
            return true
        }

        event.preventDefault()
        const channel_name = event.target.getAttribute("data-name")
        assert(is_string(channel_name), "$channel_name must be of type string")

        for (let j = 0; j < this.columns.length; j++) {
            const column = this.columns[j]
            if (column.type !== enums.column.type.channel) {
                continue
            }
            if (column.params.channel.name === channel_name) {
                return Toast.push("すでに開いています", false)
            }
        }

        try {
            const channel = await try_load_channel_by_name(channel_name, community.id)
            const initial_statuses = await try_load_channel_timeline(channel.id)

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
                initial_statuses,
                source_column)
        } catch (error) {
            Toast.push(error.toString(), false)
        }
    }
    onClickMention = async (event, source_column) => {
        const desktop_settings = get_desktop_settings()
        if (desktop_settings.multiple_columns_enabled === false) {
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

        try {
            const recipient = await try_load_user_by_name(name)
            const initial_statuses = await try_load_message_timeline(recipient.id)

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
                { recipient },
                column_options,
                column_settings,
                initial_statuses,
                source_column)
        } catch (error) {
            console.log(error)
            Toast.push(error.toString(), false)
        }
    }
    onClickThread = async (event, source_column, in_reply_to_status_id) => {
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
                return Toast.push("すでに開いています", false)
            }
        }

        try {
            const status = await try_load_status_by_id(in_reply_to_status_id)
            const initial_statuses = await try_load_thread_timeline(status.id)

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
                { "in_reply_to_status": status, "community": status.community, "channel": status.channel },
                column_options,
                column_settings,
                initial_statuses,
                source_column)
        } catch (error) {
            Toast.push(error.toString(), false)
        }
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
                <JoinedChannelsListContainer
                    expanded={this.state.expanded}
                    community={community}
                    joined_channels={joined_channels}
                    handle_click_channel={this.onClickChannel} />
                {columnComponents}
                <CommunityDetailContainer
                    expanded={this.state.expanded}
                    community={community}
                    logged_in_user={logged_in_user}
                    handle_click_channel={this.onClickChannel}
                    handle_click_mention={this.onClickMention}
                    handle_click_thread={this.onClickThread} />
            </div>
        )
    }
}

const JoinedChannelsListContainer = ({ joined_channels, expanded, community, handle_click_channel }) => {
    if (expanded) {
        return null
    }
    if (!!community === false) {
        return null
    }
    return (
        <div className="column-component channels">
            <JoinedChannelsListComponent
                channels={joined_channels}
                community={community}
                handle_click_channel={handle_click_channel} />
        </div>
    )
}

const CommunityDetailContainer = ({ expanded, community, logged_in_user, handle_click_channel, handle_click_mention, handle_click_thread }) => {
    if (expanded) {
        return null
    }
    if (!!community === false) {
        return null
    }
    return (
        <div className="column-component community-overview">
            <CommunityDetailComponent
                community={community}
                logged_in_user={logged_in_user}
                handle_click_channel={handle_click_channel}
                handle_click_mention={handle_click_mention}
                handle_click_thread={handle_click_thread} />
        </div>
    )
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
        const { column, logged_in_user, request_query, pinned_media, recent_uploads, width } = this.props

        const props = {
            "handle_click_channel": this.onClickChannel,
            "handle_click_mention": this.onClickMention,
            "handle_click_thread": this.onClickThread,
            "handle_expand": this.onExpand,
            "handle_close": this.onClose,
            "handle_back": this.onBack,
            "uploader": this.uploader,
            column, logged_in_user, request_query,
            pinned_media, recent_uploads, width
        }

        if (column.type === enums.column.type.message) {
            return <MessageColumnComponent {...props} />
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
        const { column, uploader, logged_in_user, pinned_media, recent_uploads, request_query, width } = this.props
        const { handle_close, handle_expand, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        const is_narrow_column = width < 400

        return (
            <div className={classnames("column-component timeline", {
                "narrow": is_narrow_column
            })} style={{ "width": `${width}px` }}>
                <div className="inside round">
                    <ThreadTimelineHeaderComponent
                        column={column}
                        handle_close={handle_close}
                        handle_expand={handle_expand}
                        handle_back={handle_back} />
                    <div className="contents">
                        <PostboxComponent
                            postbox={this.postbox}
                            column={column}
                            logged_in_user={logged_in_user}
                            uploader={uploader}
                            pinned_media={pinned_media}
                            recent_uploads={recent_uploads} />
                        <TimelineComponent
                            column={column}
                            logged_in_user={logged_in_user}
                            request_query={request_query}
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
class MessageColumnComponent extends Component {
    constructor(props) {
        super(props)
        const { column } = props
        assert(column.type === enums.column.type.message, "$column.type must be 'message'")

        const { recipient } = column.params
        assert(is_object(recipient), "$recipient must be of type object")
        this.postbox = new PostboxStore({
            "recipient_id": recipient.id
        })
    }
    render() {
        const { column, uploader, logged_in_user, pinned_media, recent_uploads, request_query, width } = this.props
        const { handle_close, handle_expand, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        const { recipient } = column.params
        const is_narrow_column = width < 400
        return (
            <div className={classnames("column-component timeline", {
                "narrow": is_narrow_column
            })} style={{ "width": `${width}px` }}>
                <div className="inside round">
                    <MessageTimelineHeaderComponent
                        column={column}
                        logged_in_user={logged_in_user}
                        handle_close={handle_close}
                        handle_expand={handle_expand}
                        handle_back={handle_back} />
                    <div className="contents">
                        <PostboxComponent
                            logged_in_user={logged_in_user}
                            uploader={uploader}
                            column={column}
                            pinned_media={pinned_media}
                            recent_uploads={recent_uploads}
                            postbox={this.postbox} />
                        <TimelineComponent
                            logged_in_user={logged_in_user}
                            column={column}
                            request_query={request_query}
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
        const { column, uploader, logged_in_user, pinned_media, recent_uploads, request_query, width } = this.props
        const { handle_close, handle_expand, handle_back, handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        const { channel } = column.params
        const is_narrow_column = width < 400
        return (
            <div className={classnames("column-component timeline", {
                "narrow": is_narrow_column
            })} style={{ "width": `${width}px` }}>
                <div className="inside round">
                    <ChannelTimelineHeaderComponent
                        column={column}
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
                                    className={classnames("button ready user-defined-bg-color", { "in-progress": this.state.pending_join })}
                                    onClick={this.onJoin}>
                                    <span className="progress-text">参加する</span>
                                    <span className="display-text">参加する</span>
                                </button>
                                <button className="button neutral user-defined-bg-color" onClick={() => {
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
                                column={column}
                                logged_in_user={logged_in_user}
                                uploader={uploader}
                                pinned_media={pinned_media}
                                recent_uploads={recent_uploads} />
                        }
                        <TimelineComponent
                            logged_in_user={logged_in_user}
                            column={column}
                            request_query={request_query}
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
        const is_narrow_column = width < 400
        return (
            <div className={classnames("column-component timeline", {
                "narrow": is_narrow_column
            })} style={{ "width": `${width}px` }}>
                <div className="inside round">
                    <CommunityTimelineHeaderComponent
                        column={column}
                        handle_expand={handle_expand}
                        handle_close={handle_close}
                        handle_back={handle_back} />
                    <div className="contents postbox-hidden">
                        <StatusGroupTimelineComponent
                            logged_in_user={logged_in_user}
                            column={column}
                            request_query={request_query}
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
        const { column, logged_in_user, pinned_media, recent_uploads, request_query, width } = this.props
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
                            column={column}
                            request_query={request_query}
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