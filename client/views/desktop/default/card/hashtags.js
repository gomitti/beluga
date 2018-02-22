import React, { Component } from "react"
import ws from "../../../../websocket"
import { request } from "../../../../api"

export default class CardView extends Component {
	componentDidMount() {
		ws.addEventListener("message", (e) => {
			const { server } = this.props
			const data = JSON.parse(e.data)
		})
	}
	render() {
		const { hashtags, server, onClickHashtag } = this.props
		const listViews = []
		for (const hashtag of hashtags) {
			listViews.push(
				<li>
					<p className="tagname meiryo"><a className="user-defined-color" href={`/server/${server.name}/${hashtag.tagname}`} onClick={onClickHashtag} data-tagname={hashtag.tagname}>{hashtag.tagname}</a></p>
					<p className="count"><span className="verdana">{hashtag.statuses_count}</span><span className="meiryo">件</span></p>
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