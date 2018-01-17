import React, { Component } from "react"
import ws from "../../../../websocket"
import { request } from "../../../../api"

export default class CardView extends Component {
	constructor(props) {
		super(props)
		const { server } = props
		const members = server.members ? server.members : []
		this.state = { members }
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
					.post("/server/members", { "name": server_name })
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
	render() {
		const { server } = this.props
		const { members } = this.state
		const memberViews = []
		for (const user of members) {
			memberViews.push(
				<li>
					<a href={`/user/${user.name}`}>
						<img src={user.profile_image_url} />
					</a>
				</li>
			)
		}
		return (
			<div className="inside server-container round">
				<div className="content card">
					<div className="group">
						<div className="server-avatar">
							<a href={`/server/${server.name}/about`}>
								<img className="image" src={server.profile_image_url} />
							</a>
						</div>
						<div className="server-name">
							<a href={`/server/${server.name}/about`}>
								<h1>{server.display_name}</h1>
								<h2>{server.name}</h2>
							</a>
						</div>
					</div>
					<div className="server-description">
						サーバーの説明が入ります
					</div>
				</div>
				<div className="content additional server-members">
					<h3 className="title"><span className="meiryo">オンライン</span> - <span className="verdana">{memberViews.length}</span></h3>
					<div className="members">
						<ul className="server-members-list">
							{memberViews}
						</ul>
					</div>
				</div>
			</div>
		)
	}
}