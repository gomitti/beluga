import React, { Component } from "react"
import { observer } from "mobx-react"
import { observable, action } from "mobx"
import ws from "../../../websocket"
import { request } from "../../../api"

@observer
export default class HeaderView extends Component {
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
			if (data.online_changed) {
				this.setOnline(data.count)
			}
		})
	}
	render() {
		return (
			<div>
				<p>コード:<a href="https://github.com/belugafm/beluga" target="_blank">https://github.com/belugafm/beluga</a></p>
				<p><a href="/">トップ</a> / <a href="/signup">新規登録</a> / <a href="/login">ログイン</a></p>
				<p><a href="/server/create">サーバーの作成</a> / {(() => {
					if (this.props.server) {
						return <a href={`/hashtag/${this.props.server.name}/create`}>ルームの作成</a>
					}
				})()}</p>
				<p>アイコン:<a href="#" onClick={this.resetAvatar}>リセット</a> / </p>
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