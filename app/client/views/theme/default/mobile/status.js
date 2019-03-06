import { Component } from "react"
import { observer } from "mobx-react"
import config from "../../../../beluga.config"
import { build_status_body_views } from "../desktop/parser"
import ReactionsComponent from "../desktop/status/reactions"
import { request } from "../../../../api"
import assert, { is_object, is_string, is_array } from "../../../../assert"
import { created_at_to_elapsed_time, time_string_from_create_at } from "../../../../libs/date"
import { StatusHeaderDisplayNameComponent, StatusHeaderUserStatusComponent } from "./status/header"
import { Button } from "./button"
import EmojiPicker from "./emoji"
import { StatusOptions } from "../../../../stores/theme/default/common/status"
import { event_types as emoji_event_types } from "../../../../stores/theme/default/common/emoji"
import { objectid_equals } from "../../../../libs/functions"

@observer
export default class StatusComponent extends Component {
    constructor(props) {
        super(props)
        const { status, options } = props
        assert(is_object(status), "$status must be of type object")
        assert(options instanceof StatusOptions, "$options must be an instance of StatusOptions")

        // 本文のビューを構築しておく
        const { text, community, entities } = status
        const body = build_status_body_views(text, community, entities, {})

        this.state = {
            "elapsed_time_str": created_at_to_elapsed_time(status.created_at),
            "created_at_str": time_string_from_create_at(status.created_at),
            "body": body
        }

        if (typeof window !== "undefined") {
            // websocketのイベントの方にhookするとemojiの更新のタイミングとズレるので注意
            window.addEventListener(emoji_event_types.add, () => {
                const body = build_status_body_views(text, community, entities, {})
                this.setState({ body })
            })
            window.addEventListener(emoji_event_types.remove, () => {
                const body = build_status_body_views(text, community, entities, {})
                this.setState({ body })
            })
        }
    }
    componentDidMount() {
        this.updateTime()
    }
    toggleFavorite = event => {
        event.preventDefault()
        const { status } = this.props
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
        EmojiPicker.toggle((shortname, category) => {
            status.reactions.toggle(shortname)
        })
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
            "created_at_str": time_string_from_create_at(status.created_at)
        })
    }
    generateSourceLinkView = status => {
        const { options } = this.props
        if (options.show_source_link === false) {
            return null
        }
        const { channel, recipient, in_reply_to_status_id } = status
        if (in_reply_to_status_id) {
            return (
                <div className="left">
                    <a href={`/thread/${in_reply_to_status_id}`} className="source-link thread meiryo">スレッド</a>
                </div>
            )
        }
        if (channel) {
            const { community } = status
            if (!!community === false) {
                return null
            }
            return (
                <div className="left">
                    <a href={`/${community.name}/${channel.name}`} className="source-link channel meiryo">
                        <span className="icon"></span>
                        <span className="label">{channel.name}</span>
                    </a>
                </div>
            )
        }
        if (recipient) {
            return (
                <div className="left">
                    <a href={`/@${recipient.name}`} className="source-link recipient meiryo">@{recipient.name}</a>
                </div>
            )
        }
        return null
    }
    generateFavoritesVite = status => {
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
            <div className="status-favofites bar">
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
    generateCommentsView = status => {
        const { options } = this.props
        if (options.trim_comments === true) {
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
            <a onClick={event => handle_click_thread(event, status.id)} className="status-body-commenters bar" href={`/thread/${status.id}`}>
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
    generateLikesView = status => {
        if (status.likes.count === 0) {
            return null
        }
        const starViews = []
        for (let i = 0; i < status.likes.count; i++) {
            starViews.push(<p></p>)
        }
        return <div className="status-likes bar">{starViews}</div>
    }
    render() {
        const { status, community, options, logged_in_user } = this.props
        const { user } = status
        const likesView = this.generateLikesView(status)
        const favoritesView = this.generateFavoritesVite(status)
        const sourceLinkView = this.generateSourceLinkView(status)
        const commentsView = this.generateCommentsView(status)
        return (
            <div className="status">
                <div className="inside">
                    <div className="status-left">
                        <a href="/user/" className="avatar link">
                            <img src={user.avatar_url} />
                        </a>
                    </div>
                    <div className="status-right">
                        <div className="status-header">
                            <div className="inside">
                                <a href="/user/" className="link">
                                    <StatusHeaderDisplayNameComponent user={user} />
                                    <StatusHeaderUserStatusComponent user={user} />
                                    <span className="name verdana element">@{user.name}</span>
                                </a>
                                <a href={`/status/${user.name}/${status.id}`} className="time meiryo">{this.state.elapsed_time_str}</a>
                            </div>
                        </div>
                        <div className="status-content">
                            <div className="body">{this.state.body}</div>
                        </div>
                        <div className="status-bars">
                            {commentsView}
                            {likesView}
                            {favoritesView}
                            <ReactionsComponent status={status} community={community} />
                        </div>
                        <div className="status-action" ref="action">
                            <div className="inside">
                                {sourceLinkView}
                                <div className="right">
                                    <Button className="like user-defined-color-hover" onClick={this.createLike}></Button>
                                    <Button className="favorite user-defined-color-hover" onClick={this.toggleFavorite}></Button>
                                    <Button className="emoji emoji-picker-ignore-click user-defined-color-hover" onClick={this.toggleReaction}></Button>
                                    <Button className="thread user-defined-color-hover" onClick={event => { location.href = `/thread/${status.id}` }}></Button>
                                    {objectid_equals(logged_in_user.id, user.id) ?
                                        <Button className="destroy user-defined-color-hover" onClick={this.destroy}></Button>
                                        : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}