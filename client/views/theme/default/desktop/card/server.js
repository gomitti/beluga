import React, { Component } from "react"
import ws from "../../../../../websocket"
import { request } from "../../../../../api"

class MembersView extends Component {
    constructor(props) {
        super(props)
        const { server } = props
        const members = server.members ? server.members : []
        this.state = {
            members,
            "is_hidden": true,
        }
    }
    componentDidMount() {
        ws.addEventListener("message", (e) => {
            const { server } = this.props
            const data = JSON.parse(e.data)
            if (data.members_changed) {
                const { members, id } = data
                if (server.id !== id) {
                    return
                }
                this.setState({ members })
                return
            }
            if (data.members_need_reload) {
                const { server_name } = data
                if (server.name !== server_name) {
                    return
                }
                request
                    .get("/server/members", { "name": server_name })
                    .then(res => {
                        const data = res.data
                        if (data.success == false) {
                            return
                        }
                        const { members } = data
                        this.setState({ members })
                    })
                return
            }
        })
    }
    toggleMemberList = () => {
        this.setState({
            "is_hidden": !this.state.is_hidden
        })
    }
    render() {
        const { members } = this.state
        const memberViews = []
        for (const user of members) {
            memberViews.push(
                <li>
                    <a href={`/user/${user.name}`}>
                        <img src={user.avatar_url} />
                    </a>
                </li>
            )
        }
        return (
            <div className="content additional members">
                <h3 className="title" onClick={event => this.toggleMemberList()}><span className="meiryo">オンライン</span> - <span className="verdana">{memberViews.length}</span></h3>
                {this.state.is_hidden ? null :
                    <ul className="members-list">
                        {memberViews}
                    </ul>
                }
            </div>
        )
    }
}

export default class CardView extends Component {
    render() {
        const { server, is_description_hidden, is_members_hidden } = this.props
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
                    {(is_description_hidden || server.description.length === 0) ? null :
                        <div className="description">
                            {server.description}
                        </div>}
                </div>
                {is_members_hidden ? null : <MembersView server={server} />}
            </div>
        )
    }
}