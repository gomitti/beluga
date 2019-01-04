import { Component } from "react"
import ws from "../../../../../websocket"
import { request } from "../../../../../api"

export default class View extends Component {
    componentDidMount() {
        ws.addEventListener("message", (e) => {
            const { server } = this.props
            const data = JSON.parse(e.data)
        })
    }
    render() {
        const { channels, server, handle_click_channel } = this.props
        if (channels.length == 0) {
            return (
                <div className="inside channels-container round">
                    <div className="content card">
                        <h2 className="title">
                            <span className="text">チャンネル</span>
                            <a href={`/server/${server.name}/create_new_channel`} className="create user-defined-color">作成</a>
                        </h2>
                        <div className="channels-hint">
                            <p>あなたはまだどのチャンネルにも参加していません</p>
                            <p><a href={`/server/${server.name}/channels`}>チャンネル一覧</a>から興味のあるチャンネルを探してみましょう</p>
                        </div>
                    </div>
                </div>
            )
        }
        const listViews = []
        channels.forEach(channel => {
            listViews.push(
                <li>
                    <p className="name meiryo">
                        <a className="user-defined-color"
                            href={`/server/${server.name}/${channel.name}`}
                            onClick={handle_click_channel}
                            data-name={channel.name}>
                            <span className="name-str" data-name={channel.name}>{channel.name}</span></a>
                    </p>
                </li>
            )
        })
        return (
            <div className="inside channels-container round">
                <div className="content card">
                    <h2 className="title">
                        <span className="text">チャンネル</span>
                        <a href={`/server/${server.name}/create_new_channel`} className="create user-defined-color">作成</a>
                    </h2>
                    <ul className="channels-list">
                        {listViews}
                    </ul>
                </div>
            </div>
        )
    }
}