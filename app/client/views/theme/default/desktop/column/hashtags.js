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
        const { hashtags, server, handle_click_hashtag } = this.props
        if (hashtags.length == 0) {
            return (
                <div className="inside hashtags-container round">
                    <div className="content card">
                        <h2 className="title">
                            <span className="text">ルーム</span>
                            <a href={`/hashtag/${server.name}/create`} className="create user-defined-color">作成</a>
                        </h2>
                        <div className="hashtags-hint">
                            <p>あなたはまだどのルームにも参加していません</p>
                            <p><a href={`/server/${server.name}/hashtags`}>ルーム一覧</a>から興味のあるルームを探してみましょう</p>
                        </div>
                    </div>
                </div>
            )
        }
        const listViews = []
        for (const hashtag of hashtags) {
            listViews.push(
                <li>
                    <p className="tagname meiryo"><a className="user-defined-color" href={`/server/${server.name}/${hashtag.tagname}`} onClick={handle_click_hashtag} data-tagname={hashtag.tagname}>{hashtag.tagname}</a></p>
                </li>
            )
        }
        return (
            <div className="inside hashtags-container round">
                <div className="content card">
                    <h2 className="title">
                        <span className="text">ルーム</span>
                        <a href={`/hashtag/${server.name}/create`} className="create user-defined-color">作成</a>
                    </h2>
                    <ul className="hashtags-list">
                        {listViews}
                    </ul>
                </div>
            </div>
        )
    }
}