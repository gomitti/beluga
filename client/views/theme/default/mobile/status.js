import { Component } from "react"
import { observer } from "mobx-react"
import config from "../../../../beluga.config"
import { build_status_body_views } from "../desktop/parser"
import ReactionsView from "../desktop/status/reactions"
import { request } from "../../../../api"
import assert, { is_object, is_string } from "../../../../assert"
import { created_at_to_elapsed_time, time_from_create_at } from "../../../../libs/date"
import { StatusHeaderDisplayNameView, StatusHeaderUserStatusView } from "./status/header"
import Button from "./button"

@observer
export default class StatusView extends Component {
    constructor(props) {
        super(props)
        const { status, server, handle_click_hashtag, handle_click_mention } = props
        assert(is_object(status), "@status must be of type object")

        // 本文のビューを構築しておく
        const { text, entities } = status
        this.bodyViews = build_status_body_views(text, server, entities, { handle_click_hashtag, handle_click_mention })

        this.state = {
            "elapsed_time_str": created_at_to_elapsed_time(status.created_at),
            "created_at_str": time_from_create_at(status.created_at)
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
        const { x, y } = event.target.getBoundingClientRect()
        emojipicker.show(x, y + window.pageYOffset + event.target.clientHeight, shortname => {
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
            "created_at_str": time_from_create_at(status.created_at)
        })
    }
    render() {
        const { status, server, options } = this.props
        const { user } = status
        let likesView = null
        if (status.likes.count > 0) {
            const starViews = []
            for (let i = 0; i < status.likes.count; i++) {
                starViews.push(<p></p>)
            }
            likesView = <div className="status-likes">{starViews}</div>
        }

        let favoritesView = null
        if (status.favorites.count > 0) {
            const userViews = []
            for (const user of status.favorites.users) {
                userViews.push(
                    <a href={`/user/${user.name}`} target="_blank">
                        <img src={user.avatar_url} />
                    </a>
                )
            }
            favoritesView = <div className="status-favofites">
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

        let belongingView = null
        const { hashtag, recipient } = status
        if (options.show_belonging) {
            if (hashtag && server) {
                belongingView = <a href={`/server/${server.name}/${hashtag.tagname}`} className="belonging hashtag meiryo">#{hashtag.tagname}</a>
            }
            if (recipient && server) {
                belongingView = <a href={`/server/${server.name}/@${recipient.name}`} className="belonging recipient meiryo">@{recipient.name}</a>
            }
        }
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
                                    <StatusHeaderDisplayNameView user={user} />
                                    <StatusHeaderUserStatusView user={user} />
                                    <span className="name verdana element">@{user.name}</span>
                                </a>
                                <a href={`/status/${user.name}/${status.id}`} className="time meiryo">{this.state.elapsed_time_str}</a>
                            </div>
                        </div>
                        <div className="status-content">
                            <div className="body">{this.bodyViews}</div>
                        </div>
                        {likesView}
                        {favoritesView}
                        <ReactionsView status={status} server={server} />
                        <div className="status-action" ref="action">
                            <div className="inside">
                                {belongingView ?
                                    <div className="left">
                                        {belongingView}
                                    </div>
                                    : null
                                }
                                <div className="right">
                                    <Button className="like user-defined-color-hover" onClick={this.createLike}></Button>
                                    <Button className="favorite user-defined-color-hover" onClick={this.toggleFavorite}></Button>
                                    <Button className="comment user-defined-color-hover"></Button>
                                    <Button className="destroy user-defined-color-hover" onClick={this.destroy}></Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}