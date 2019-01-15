import { Component } from "react"
import { observer } from "mobx-react"
import config from "../../../../beluga.config"
import { build_status_body_views } from "./parser"
import ReactionsView from "./status/reactions"
import { request } from "../../../../api"
import assert, { is_object, is_string, is_array, is_function } from "../../../../assert"
import { created_at_to_elapsed_time, time_string_from_create_at, date_string_from_create_at } from "../../../../libs/date"
import { StatusHeaderDisplayNameView, StatusHeaderUserStatusView } from "./status/header"
import { get_shared_picker_store } from "../../../../stores/theme/default/common/emoji"
import Tooltip from "./tooltip"
import EmojiPicker from "./emoji"
import { StatusOptions } from "../../../../stores/theme/default/common/status"
import { objectid_equals } from "../../../../libs/functions"

class ActionButton extends Component {
    render() {
        const { type, description, handle_click, href } = this.props
        return (
            <a className={`action-button ${type} user-defined-color-hover`}
                href={href}
                onClick={handle_click}
                ref={dom => this.dom = dom}
                onMouseEnter={() => Tooltip.show(this.dom, description)}
                onMouseOver={() => Tooltip.show(this.dom, description)}
                onMouseOut={() => Tooltip.hide()}>
                <span className="icon"></span>
            </a>
        )
    }
}

export class StatusTimeView extends Component {
    render() {
        const { href, string, description } = this.props
        return (
            <a href={href} className="time verdana"
                ref={dom => this.dom = dom}
                onMouseEnter={() => Tooltip.show(this.dom, description)}
                onMouseOver={() => Tooltip.show(this.dom, description)}
                onMouseOut={() => Tooltip.hide()}>
                <span className="elapsed-time">{string}</span>
            </a>
        )
    }
}

@observer
export default class StatusView extends Component {
    constructor(props) {
        super(props)
        const { status, options, handle_click_channel, handle_click_mention, handle_click_thread, cache_body } = props
        assert(is_object(status), "$status must be of type object")
        assert(options instanceof StatusOptions, "$options must be an instance of StatusOptions")
        assert(is_function(handle_click_channel), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_mention), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_thread), "$handle_click_channel must be of type function")

        // 本文のビューを構築しておく
        const { text, server, entities } = status
        this.bodyViews = build_status_body_views(text, server, entities, { handle_click_channel, handle_click_mention, handle_click_thread })

        const { created_at } = status
        this.state = {
            "elapsed_time_str": created_at_to_elapsed_time(created_at),
            "created_at_str": time_string_from_create_at(created_at),
            "date_str": date_string_from_create_at(created_at),
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
    render() {
        const { status, options, handle_click_channel, handle_click_mention, handle_click_thread, logged_in_user, trim_comments } = this.props
        console.log(`[status] rendering ${status.id}`)
        const { user } = status
        let likesView = null
        if (status.likes.count > 0) {
            const starViews = []
            for (let i = 0; i < status.likes.count; i++) {
                starViews.push(<p></p>)
            }
            likesView = <div className="status-likes bar">{starViews}</div>
        }

        let favoritesView = null
        if (status.favorites.count > 0) {
            const userViews = []
            status.favorites.users.forEach(user => {
                userViews.push(
                    <a href={`/user/${user.name}`} target="_blank">
                        <img src={user.avatar_url} />
                    </a>
                )
            })
            favoritesView = <div className="status-favofites bar">
                <div className="users">
                    {userViews}
                </div>
                <div className="meta">
                    <span className="sep"></span>
                    <span className="count verdana">{status.favorites.count}</span>
                    <span className="unit meiryo">ふぁぼ</span>
                </div>
            </div>
        }

        let sourceLinkView = null
        const { server, channel, recipient } = status
        if (options.show_source_link) {
            if (channel && server) {
                sourceLinkView = <a href={`/server/${server.name}/${channel.name}`} onClick={handle_click_channel} className="source channel meiryo" data-name={channel.name}>#{channel.name}</a>
            }
            if (recipient && server) {
                sourceLinkView = <a href={`/server/${server.name}/@${recipient.name}`} onClick={handle_click_mention} className="source recipient meiryo" data-name={recipient.name}>@{recipient.name}</a>
            }
        }

        let commentsView = null
        if (trim_comments === false && status.comments.count > 0) {
            const commentersView = []
            status.comments.commenters.forEach(user => {
                commentersView.push(
                    <img src={user.avatar_url} className="avatar" />
                )
            })
            let preview_text = status.last_comment ? status.last_comment.text : ""
            if (preview_text.length > 100) {
                preview_text = preview_text.substr(0, 100)
            }
            commentsView = <a onClick={event => handle_click_thread(event, status.id)} className="status-body-commenters bar" href={`/server/${server.name}/thread/${status.id}`}>
                <div className="commenters">{commentersView}</div>
                <div className="stats">
                    <span className="latest-comment">{preview_text}</span>
                    <span className="comments-count">{status.comments.count}</span>
                    <span className="comments-label">件のコメント</span>
                </div>
            </a>
        }
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
                                    <StatusHeaderDisplayNameView user={user} />
                                    <StatusHeaderUserStatusView user={user} />
                                    <span className="name verdana element">@{user.name}</span>
                                </a>
                                <StatusTimeView href={`/status/${user.name}/${status.id}`} string={this.state.elapsed_time_str} description={this.state.date_str} />
                            </div>
                        </div>
                        <div className="status-content">
                            <div className="body">{this.bodyViews}</div>
                        </div>
                        <div className="status-bars">
                            {commentsView}
                            {likesView}
                            {favoritesView}
                            <ReactionsView status={status} server={server} />
                        </div>
                        <div className="status-footer" ref="footer">
                            {sourceLinkView}
                            <StatusTimeView href={`/status/${user.name}/${status.id}`} string={this.state.created_at_str} description={this.state.date_str} />
                        </div>
                    </div>
                    {logged_in_user ?
                        <div className="status-action" ref="action">
                            <div className="inside">
                                <ActionButton type="like" description="いいね" handle_click={this.createLike} />
                                <ActionButton type="favorite" description="ふぁぼ" handle_click={this.toggleFavorite} />
                                <ActionButton type="emoji" description="リアクション" handle_click={this.toggleReaction} />
                                <ActionButton type="thread" description="コメント" handle_click={event => handle_click_thread(event, status.id)} href={`/server/${server.name}/thread/${status.id}`} />
                                {objectid_equals(logged_in_user.id, status.user.id) ?
                                    <ActionButton type="destroy" description="削除" handle_click={this.destroy} />
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