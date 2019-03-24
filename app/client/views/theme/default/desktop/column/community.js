import React, { Component } from "react"
import classnames from "classnames"
import ws from "../../../../../websocket"
import { request } from "../../../../../api"
import { build_status_body_views } from "../parser";
import assert, { is_object, is_function } from "../../../../../assert"
import { objectid_equals } from "../../../../../libs/functions"

class UserListComponent extends Component {
    render() {
        const { users, is_hidden } = this.props
        if (is_hidden) {
            return null
        }
        const listViews = []
        users.forEach(user => {
            listViews.push(
                <a key={user.id} className="user" href={`/user/${user.name}`}>
                    <img src={user.avatar_url} className="avatar" />
                </a>
            )
        })
        return (
            <ul className="list">{listViews}</ul>
        )
    }
}

class MembersComponent extends Component {
    constructor(props) {
        super(props)
        this.pending = false
        const { community } = props
        this.state = {
            "members": [],
            "members_count": community.members_count,
            "is_list_hidden": true,
            "members_loaded": false
        }
    }
    toggle = event => {
        event.preventDefault()
        if (this.state.members_loaded === false && this.pending === false) {
            this.pending = true
            const { community } = this.props
            request
                .get("/community/members", { "community_id": community.id })
                .then(res => {
                    const data = res.data
                    if (data.success == false) {
                        this.pending = false
                        return
                    }
                    const { members } = data
                    this.setState({ members, "members_loaded": true })
                    this.pending = false
                })
        }
        this.setState({
            "is_list_hidden": !this.state.is_list_hidden
        })
    }
    render() {
        const { members } = this.state
        return (
            <div className="members-area">
                <a className="item" onClick={this.toggle}>
                    <span className="icon members"></span>
                    <span className="verdana count">{this.state.members_count}</span>
                    <span className="meiryo label">ユーザー</span>
                </a>
                <UserListComponent users={members} is_hidden={this.state.is_list_hidden} is_active={true} />
            </div>
        )
    }
}


class OnlineMembersComponent extends Component {
    constructor(props) {
        super(props)
        const { community } = props
        this.state = {
            "members": community.online_members ? community.online_members : [],
            "is_list_hidden": true
        }
    }
    componentDidMount() {
        ws.addEventListener("message", (e) => {
            const { community } = this.props
            const data = JSON.parse(e.data)
            if (data.online_members_changed) {
                request
                    .get("/community/online_members", { "community_name": community.name })
                    .then(res => {
                        const data = res.data
                        if (data.success == false) {
                            return
                        }
                        const { members } = data
                        this.setState({ members })
                    })
            }
        })
    }
    toggle = event => {
        event.preventDefault()
        this.setState({
            "is_list_hidden": !this.state.is_list_hidden
        })
    }
    render() {
        const { members } = this.state
        return (
            <div className="members-area">
                <a className="item" onClick={this.toggle}>
                    <span className="icon online-members"></span>
                    <span className="verdana count">{members.length}</span>
                    <span className="meiryo label">オンライン</span>
                </a>
                <UserListComponent users={members} is_hidden={this.state.is_list_hidden} is_active={true} />
            </div>
        )
    }
}

export default class View extends Component {
    constructor(props) {
        super(props)
        const { community, handle_click_channel, handle_click_mention } = props
        assert(is_object(community), "$community must be of type object")
        assert(is_function(handle_click_channel), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function")
        const { description } = community
        this.descriptionView = build_status_body_views(description, community, {}, { handle_click_channel, handle_click_mention })
    }
    render() {
        const { community, logged_in_user } = this.props
        return (
            <div className="inside round">
                <div className="header">
                    <div className="avatar">
                        <a href={`/${community.name}`}>
                            <img className="image" src={community.avatar_url} />
                        </a>
                    </div>
                    <div className="name">
                        <a href={`/${community.name}`}>{community.display_name}</a>
                    </div>
                    <div className="dropdown-menu user-defined-color-hover">
                        <span className="icon"></span>
                        <div className="dropdown-component">
                            <div className="inside">
                                <ul className="menu">
                                    <a className="item user-defined-bg-color-hover" href={`/${community.name}/statuses`}>パブリックタイムライン</a>
                                    <a className="item user-defined-bg-color-hover" href={`/${community.name}/channels`}>チャンネル一覧</a>
                                    <span className="divider"></span>
                                    <a className="item user-defined-bg-color-hover" href={`/${community.name}/settings/profile`}>コミュニティ設定</a>
                                    <a className="item user-defined-bg-color-hover" href={`/${community.name}/customize/emoji`}>絵文字の追加</a>
                                    <a className="item user-defined-bg-color-hover" href={`/${community.name}/create_new_channel`}>チャンネルの作成</a>
                                    <span className="divider"></span>
                                    <a className="item user-defined-bg-color-hover">{`${community.display_name} から退出する`}</a>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                {this.descriptionView ?
                    <div className="description-area">
                        {this.descriptionView}
                    </div>
                    : null
                }
                <MembersComponent community={community} />
                <OnlineMembersComponent community={community} />
            </div>
        )
    }
}