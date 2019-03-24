import { Component } from "react"
import { observer } from "mobx-react"
import config from "../../../../beluga.config"
import { build_status_body_views } from "./parser"
import ReactionsComponent from "./status/reactions"
import { request } from "../../../../api"
import assert, { is_object, is_string, is_array, is_function } from "../../../../assert"
import { created_at_to_elapsed_time, time_string_from_create_at, date_string_from_create_at } from "../../../../libs/date"
import { StatusHeaderDisplayNameComponent, StatusHeaderUserStatusComponent } from "./status/header"
import { event_types as emoji_event_types } from "../../../../stores/theme/default/common/emoji"
import Tooltip from "./tooltip"
import EmojiPicker from "./emoji"
import { StatusOptions } from "../../../../stores/theme/default/common/status"
import { objectid_equals } from "../../../../libs/functions"

class ActionButton extends Component {
    render() {
        const { type, label, handle_click, href } = this.props
        return (
            <a className={`action-button ${type} user-defined-color-hover`}
                href={href}
                onClick={handle_click}
                ref={dom => this.dom = dom}
                onMouseEnter={() => Tooltip.show(this.dom, label)}
                onMouseOver={() => Tooltip.show(this.dom, label)}
                onMouseOut={() => Tooltip.hide()}>
                <span className="icon"></span>
            </a>
        )
    }
}

export class StatusTimeComponent extends Component {
    render() {
        const { href, string, label } = this.props
        return (
            <a href={href} className="time verdana"
                ref={dom => this.dom = dom}
                onMouseEnter={() => Tooltip.show(this.dom, label)}
                onMouseOver={() => Tooltip.show(this.dom, label)}
                onMouseOut={() => Tooltip.hide()}>
                <span className="elapsed-time">{string}</span>
            </a>
        )
    }
}

@observer
export default class StatusComponent extends Component {
    constructor(props) {
        super(props)
        const { status, options, handle_click_channel, handle_click_mention, handle_click_thread, cache_body } = props
        assert(is_object(status), "$status must be of type object")
        assert(options instanceof StatusOptions, "$options must be an instance of StatusOptions")
        assert(is_function(handle_click_channel), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_mention), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_thread), "$handle_click_channel must be of type function")

        // 本文のビューを構築しておく
        const { text, community, entities } = status
        const body = build_status_body_views(text, community, entities, { handle_click_channel, handle_click_mention, handle_click_thread })

        const { created_at } = status
        this.state = {
            "elapsed_time_str": created_at_to_elapsed_time(created_at),
            "created_at_str": time_string_from_create_at(created_at),
            "date_str": date_string_from_create_at(created_at),
            "body": body
        }
        if (typeof window !== "undefined") {
            // websocketのイベントの方にhookするとemojiの更新のタイミングとズレるので注意
            window.addEventListener(emoji_event_types.add, () => {
                const body = build_status_body_views(text, community, entities, { handle_click_channel, handle_click_mention, handle_click_thread })
                this.setState({ body })
            })
            window.addEventListener(emoji_event_types.remove, () => {
                const body = build_status_body_views(text, community, entities, { handle_click_channel, handle_click_mention, handle_click_thread })
                this.setState({ body })
            })
        }
    }
    componentDidMount = () => {
        this.updateTime()
    }
    onMouseEnter = event => {
        const { footer, action } = this.refs
        if (action) {
            action.style.top = `${footer.offsetTop - 5}px`
            this.prev_footer_offset_top = footer.offsetTop
        }
    }
    onMouseMove = event => {
        const { footer, action } = this.refs
        if (!!action == false) {
            return
        }
        if (footer.offsetTop !== this.prev_footer_offset_top) {
            action.style.top = `${footer.offsetTop - 5}px`
            this.prev_footer_offset_top = footer.offsetTop
        }
    }
    onMouseLeave = event => {
        const footer = this.refs.footer
    }
    toggleFavorite = event => {
        event.preventDefault()
        const { status } = this.props
        console.log(status)
        if (status.favorited) {
            status.favorites.destroy()
        } else {
            status.favorites.create()
        }
    }
    createLike = event => {
        event.preventDefault()
        const { status } = this.props
        status.likes.increment()
    }
    toggleReaction = event => {
        event.preventDefault()
        const { status } = this.props
        EmojiPicker.toggle(event.target, shortname => {
            status.reactions.toggle(shortname)
        }, null)
    }
    destroy = event => {
        event.preventDefault()
        const { status } = this.props
        status.destroy()
    }
    updateTime() {
        const { status } = this.props
        const base = Date.now()
        let diff = (base - status.created_at) / 1000
        let new_interval = 3600
        if (diff < 60) {
            new_interval = 5
        } else if (diff < 3600) {
            new_interval = 60
        } else {
            new_interval = 1800
        }
        clearInterval(this._update_time)
        this._update_time = setInterval(() => {
            this.updateTime()
        }, new_interval * 1000)
        this.setState({
            "elapsed_time_str": created_at_to_elapsed_time(status.created_at),
        })
    }
    generateSourceLinkView = status => {
        const { options } = this.props
        if (options.show_source_link === false) {
            return null
        }
        const { channel, in_reply_to_status_id } = status
        const { handle_click_channel, handle_click_mention, handle_click_thread } = this.props
        if (in_reply_to_status_id) {
            return <a href={`/thread/${in_reply_to_status_id}`}
                className="source-link thread meiryo"
                onClick={event => handle_click_thread(event, in_reply_to_status_id)}>スレッド</a>
        }
        if (channel) {
            const { community } = status
            if (!!community === false) {
                return null
            }
            return <a href={`/${community.name}/${channel.name}`}
                className="source-link channel meiryo"
                onClick={handle_click_channel}
                data-name={channel.name}>
                <span className="icon"></span>
                <span className="label">{channel.name}</span>
            </a>
        }
        return null
    }
    generateCommentersView = status => {
        const { options, handle_click_thread } = this.props
        if (options.trim_comments) {
            return null
        }
        if (status.comments.count === 0) {
            return null
        }
        const commentersView = []
        const commenters = status.comments.commenters.reverse()
        commenters.forEach(user => {
            commentersView.push(
                <img src={user.avatar_url} className="avatar" />
            )
        })
        let preview_text = status.last_comment ? status.last_comment.text : ""
        if (preview_text.length > 100) {
            preview_text = preview_text.substr(0, 100)
        }
        return (
            <a onClick={event => handle_click_thread(event, status.id)}
                className="status-body-commenters detail-row"
                href={`/thread/${status.id}`}>
                <div className="commenters">{commentersView}</div>
                <div className="stats">
                    <span className="latest-comment">{preview_text}</span>
                    <span className="count">{status.comments.count}</span>
                    <span className="label">件のコメント</span>
                    <span className="arrow"></span>
                </div>
            </a>
        )
    }
    generateFavoritesView = status => {
        if (status.favorites.count === 0) {
            return null
        }
        const userViews = []
        status.favorites.users.forEach(user => {
            userViews.push(
                <a href={`/user/${user.name}`} target="_blank">
                    <img src={user.avatar_url} />
                </a>
            )
        })
        return (
            <div className="status-favofites detail-row">
                <div className="users">
                    {userViews}
                </div>
                <div className="meta">
                    <span className="sep"></span>
                    <span className="count verdana">{status.favorites.count}</span>
                    <span className="unit meiryo">ふぁぼ</span>
                </div>
            </div>
        )
    }
    generateLikesView = status => {
        if (status.likes.count === 0) {
            return null
        }
        const starViews = []
        for (let i = 0; i < status.likes.count; i++) {
            starViews.push(<p></p>)
        }
        return <div className="status-likes detail-row">{starViews}</div>
    }
    render() {
        const { status, options, handle_click_channel, handle_click_mention, handle_click_thread, logged_in_user } = this.props
        console.log(`[status] rendering ${status.id}`)
        const { user, community } = status
        const likesView = this.generateLikesView(status)
        const favoritesView = this.generateFavoritesView(status)
        const sourceLinkView = this.generateSourceLinkView(status)
        const commentsView = this.generateCommentersView(status)
        return (
            <div className="status" onMouseEnter={this.onMouseEnter} onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseLeave} key={status.id}>
                <div className="inside">
                    <div className="status-left">
                        <a href={`/user/${user.name}`} className="avatar link">
                            <img src={user.avatar_url} className="image" />
                        </a>
                    </div>
                    <div className="status-right">
                        <div className="status-header">
                            <div className="inside">
                                <a href={`/user/${user.name}`} className="link">
                                    <StatusHeaderDisplayNameComponent user={user} />
                                    <StatusHeaderUserStatusComponent user={user} />
                                    <span className="name verdana element">@{user.name}</span>
                                </a>
                                <StatusTimeComponent href={`/status/${user.name}/${status.id}`} string={this.state.elapsed_time_str} label={this.state.date_str} />
                            </div>
                        </div>
                        <div className="status-content">
                            <div className="body">{this.state.body}</div>
                        </div>
                        <div className="status-details">
                            {commentsView}
                            {likesView}
                            {favoritesView}
                            <ReactionsComponent status={status} community={community} />
                        </div>
                        <div className="status-footer" ref="footer">
                            {sourceLinkView}
                        </div>
                    </div>
                    {logged_in_user ?
                        <div className="status-action" ref="action">
                            <div className="inside">
                                <ActionButton type="like" label="いいね" handle_click={this.createLike} />
                                <ActionButton type="favorite" label="ふぁぼ" handle_click={this.toggleFavorite} />
                                <ActionButton type="emoji" label="リアクション" handle_click={this.toggleReaction} />
                                <ActionButton type="thread" label="スレッド" handle_click={event => handle_click_thread(event, status.id)} href={`/thread/${status.id}`} />
                                {objectid_equals(logged_in_user.id, status.user.id) ?
                                    <ActionButton type="destroy" label="削除" handle_click={this.destroy} />
                                    : null}
                            </div>
                        </div>
                        :
                        null
                    }
                </div>
            </div>
        )
    }
}