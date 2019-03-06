import React, { Component } from "react"
import { observer, observable, action } from "../../../stores/theme/default/common/mobx"
import ws from "../../../websocket"
import { request } from "../../../api"

@observer
export default class HeaderComponent extends Component {
    @observable online = 0

    @action.bound
    setOnline(count) {
        this.online = count
    }
    resetAvatar = event => {
        event.preventDefault()
        request
            .post("/account/avatar/reset", {})
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    return
                }
                alert("変更しました")
            })
            .catch(error => {
                alert(error)
            })
    }
    componentDidMount() {
        ws.addEventListener("message", (event) => {
            const data = JSON.parse(event.data)
            if (data.online_members_changed) {
                this.setOnline(data.count)
            }
        })
    }
    render() {
        return (
            <div>
                <p><a href="/">トップ</a> / <a href="/signup">新規登録</a> / <a href="/login">ログイン</a></p>
                <p><a href="/create">コミュニティの作成</a> / {(() => {
                    if (this.props.community) {
                        return <a href={`/channel/${this.props.community.name}/create`}>チャンネルの作成</a>
                    }
                })()}</p>
                <p>アイコン:<a href="#" onClick={this.resetAvatar}>リセット</a> / </p>
                {(() => {
                    if (this.props.logged_in_user) {
                        return <p>ログイン中:@{this.props.logged_in_user.name}</p>
                    }
                })()}
                <p>オンライン:{this.online}</p>
            </div>
        );
    }
}