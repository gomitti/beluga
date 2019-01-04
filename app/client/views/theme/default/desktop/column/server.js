import React, { Component } from "react"
import classnames from "classnames"
import ws from "../../../../../websocket"
import { request } from "../../../../../api"
import { build_status_body_views } from "../parser";
import assert, { is_object, is_function } from "../../../../../assert"

class UserListView extends Component {
    render() {
        const { users, is_active, is_hidden } = this.props
        if (is_hidden) {
            return null
        }
        const listViews = []
        users.forEach(user => {
            listViews.push(
                <li key={user.id} className="user">
                    <a href={`/user/${user.name}`}>
                        <img src={user.avatar_url} className={classnames({
                            "offline": !is_active
                        })} />
                    </a>
                </li>
            )
        })
        return (
            <ul className="list">{listViews}</ul>
        )
    }
}

class MembersView extends Component {
    constructor(props) {
        super(props)
        const { server, collapse } = props
        this.online_members = server.online_members ? server.online_members : []
        this.members = null
        this.pending = false
        this.state = {
            "online_members": this.online_members,
            "offline_members": [],
            "is_hidden": collapse,
        }
    }
    componentDidMount() {
        ws.addEventListener("message", (e) => {
            const { server } = this.props
            const data = JSON.parse(e.data)
            if (data.online_members_changed) {
                request
                    .get("/server/online_members", { "name": server.name })
                    .then(res => {
                        const data = res.data
                        if (data.success == false) {
                            return
                        }
                        const { members } = data
                        this.online_members = members
                        this.updateMemberList()
                    })
            }
        })
    }
    toggleMemberList = event => {
        event.preventDefault()
        if (this.state.is_hidden === true && this.members === null && this.pending === false) {
            this.pending = true
            const { server } = this.props
            request
                .get("/server/members", { "id": server.id })
                .then(res => {
                    const data = res.data
                    if (data.success == false) {
                        this.pending = false
                        return
                    }
                    const { members } = data
                    this.members = members
                    this.updateMemberList()
                    this.pending = false
                })
        }
        this.setState({
            "is_hidden": !this.state.is_hidden
        })
    }
    updateMemberList = () => {
        const { members, online_members } = this
        if (members === null) {
            this.setState({
                "online_members": online_members,
            })
            return
        }
        const set_online_members = new Set()
        online_members.forEach(user => {
            set_online_members.add(user.id)
        })
        const offline_members = []
        members.forEach(user => {
            if (set_online_members.has(user.id)) {
                return
            }
            offline_members.push(user)
        })
        this.setState({
            "online_members": online_members,
            "offline_members": offline_members,
        })
    }
    render() {
        const { offline_members, online_members } = this.state
        return (
            <div className="content additional members">
                <div className="section">
                    <h3 className="title" onClick={this.toggleMemberList}><span className="meiryo">オンライン</span> - <span className="verdana">{this.online_members.length}</span></h3>
                    <UserListView users={online_members} is_hidden={this.state.is_hidden} is_active={true} />
                    <UserListView users={offline_members} is_hidden={this.state.is_hidden} is_active={false} />
                </div>
            </div>
        )
    }
}
export default class View extends Component {
    constructor(props) {
        super(props)
        const { server, is_description_hidden, ellipsis_description, handle_click_channel, handle_click_mention } = props
        assert(is_object(server), "$server must be of type object")
        assert(is_function(handle_click_channel), "$handle_click_channel must be of type function")
        assert(is_function(handle_click_mention), "$handle_click_mention must be of type function")
        let { description } = server
        if (is_description_hidden === true) {
            this.descriptionView = null
            return
        }
        if (description.length === 0) {
            this.descriptionView = null
            return
        }
        if (ellipsis_description && description.length > 500) {
            description = description.slice(0, 500)
        }
        this.descriptionView = build_status_body_views(description, server, {}, { handle_click_channel, handle_click_mention })
    }
    render() {
        const { server, ellipsis_description, is_members_hidden, collapse_members } = this.props
        return (
            <div className="inside server-container round">
                <div className="content card">
                    <div className="group">
                        <div className="avatar">
                            <a href={`/server/${server.name}/about`}>
                                <img className="image" src={server.avatar_url} />
                            </a>
                        </div>
                        <div className="name">
                            <a href={`/server/${server.name}/about`}>
                                <h1>{server.display_name}</h1>
                                <h2>{server.name}</h2>
                            </a>
                        </div>
                    </div>
                    {this.descriptionView ?
                        <div className="description">
                            {this.descriptionView}
                        </div>
                        : null
                    }
                </div>
                <MembersView server={server} collapse={collapse_members} />
            </div>
        )
    }
}