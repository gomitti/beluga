import { Component } from "react"
import ws from "../../../../../websocket"
import { request } from "../../../../../api"

export default class ChannelListComponent extends Component {
    componentDidMount() {
        ws.addEventListener("message", (e) => {
            const { community } = this.props
            const data = JSON.parse(e.data)
        })
    }
    render() {
        const { channels, community, handle_click_channel } = this.props
        if (channels.length == 0) {
            return (
                <div className="inside channel-list-component round">
                    <div className="content card">
                        <h2 className="title">
                            <span className="text">チャンネル</span>
                            <a href={`/${community.name}/create_new_channel`}
                                className="create-link user-defined-color">作成</a>
                        </h2>
                        <div className="hint-area">
                            <p>あなたはまだどのチャンネルにも参加していません</p>
                            <p><a href={`/${community.name}/channels`}>チャンネル一覧</a>から興味のあるチャンネルを探してみましょう</p>
                        </div>
                    </div>
                </div>
            )
        }
        const listViews = []
        channels.forEach(channel => {
            listViews.push(
                <a key={channel.id}
                    className="user-defined-color item"
                    href={`/${community.name}/${channel.name}`}
                    onClick={handle_click_channel}
                    data-name={channel.name}>
                    <span className="icon"></span>
                    <span className="label meiryo" data-name={channel.name}>{channel.name}</span>
                </a>
            )
        })
        return (
            <div className="inside channel-list-component round">
                <div className="content card">
                    <h2 className="title">
                        <span className="text">チャンネル</span>
                        <a href={`/${community.name}/create_new_channel`}
                            className="create-link user-defined-color">作成</a>
                    </h2>
                    <ul className="channel-list">
                        {listViews}
                    </ul>
                </div>
            </div>
        )
    }
}