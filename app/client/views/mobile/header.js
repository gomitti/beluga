import React, { Component } from "react"
import { observer } from "mobx-react"
import { observable, action } from "mobx"
import ws from "../../websocket"

@observer
export default class HeaderView extends Component {
	@observable online = 0

	@action.bound
	setOnline(count){
		this.online = count
	}
	componentDidMount() {
		ws.addEventListener("message", (e) => {
			const data = JSON.parse(e.data)
			if (data.online_members_changed){
				this.setOnline(data.count)
			}
		})
	}
	render() {
		return (
			<div>
				<p><a href="/">トップ</a> / <a href="/signup">新規登録</a> / <a href="/login">ログイン</a></p>
				<p><a href="/server/create">サーバーの作成</a> / {(() => {
					if (this.props.server) {
						return <a href={`/channel/${this.props.server.name}/create`}>チャンネルの作成</a>
					}
				})()}</p>
				{(() => {
					if (this.props.logged_in) {
						return <p>ログイン中:@{this.props.logged_in.name}</p>
					}
				})()}
				<p>オンライン:{this.online}</p>
			</div>
		);
	}
}