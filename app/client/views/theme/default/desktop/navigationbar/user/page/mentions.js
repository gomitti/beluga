import { Component } from "react"
import classnames from "classnames"
import GlobalTimelineView from "../mentions/global"
import ServerTimelineView from "../mentions/server"
import ws from "../../../../../../../websocket"
import * as notification from "../../../../../../../notification"

export default class View extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "current_tab": "global"
        }
    }
    componentDidMount() {
        ws.addEventListener("message", event => {
            const data = JSON.parse(event.data)
            if (data.mention_received) {
                const { logged_in_user } = this.props
                const { status, recipient } = data
                if (recipient.id === logged_in_user.id) {
                    let { text } = status
                    if (text.length > 140) {
                        text = text.slice(0, 140)
                    }
                    notification.push("あなた宛ての投稿があります", {
                        "body": `@${status.user.name}: ${text}`
                    })
                }
            }
        })
    }
    onClickBack = event => {
        const { back } = this.props
        back(event)
    }
    onClickTabGlobal = event => {
        event.preventDefault()
        this.setState({
            "current_tab": "global"
        })
    }
    onClickTabServer = event => {
        event.preventDefault()
        this.setState({
            "current_tab": "server"
        })
    }
    render() {
        const { current_server, logged_in_user } = this.props
        return (
            <div className="mentions navigationbar-user-mentions">
                <div className="inside">
                    <div className="overlay">
                        <div className="header">
                            <h3 className="title">@関連</h3>
                            <a className="back" href="#" onClick={this.onClickBack}>戻る</a>
                        </div>
                        <div className="tabbar">
                            <ul className="menu">
                                <li className={classnames("user-defined-border-color-active item all-server", { "active": this.state.current_tab === "global" })}>
                                    <a className="link" href="/mentions" target="_blank" onClick={this.onClickTabGlobal}>すべてのサーバー</a>
                                </li>
                                <li className={classnames("user-defined-border-color-active item current-server", { "active": this.state.current_tab === "server" })}>
                                    <a href={`/mentions/${current_server.name}`} className="link" onClick={this.onClickTabServer}>
                                        <img className="avatar" src={current_server.avatar_url} />
                                        <span className="name">{current_server.display_name}</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className={`timeline-container ${this.state.current_tab}-active scroller-container`}>
                        <GlobalTimelineView logged_in_user={logged_in_user} />
                        <ServerTimelineView logged_in_user={logged_in_user} server={current_server} />
                    </div>
                </div>
            </div>
        )
    }
}