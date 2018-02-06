import React, { Component } from "react"
import ws from "../../../../../websocket"
import * as notification from "../../../../../notification"

export default class HeaderView extends Component {
	componentDidMount() {
		ws.addEventListener("message", (e) => {
			if (this.notification_enabled !== true) {
				return
			}
			const data = JSON.parse(e.data)
			if (data.status_updated) {
				const { status } = data
				const { timeline } = this.props
				if (timeline.statusBelongsTo(status)) {
					let text = status.text
					if (text.length > 140) {
						text = text.slice(0, 140)
					}
					notification.push("新しい投稿があります", {
						"body": `@${status.user.name}: ${text}`
					})
				}
			}
		})
	}
	toggleNotification = event => {
		const checkbox = this.refs.notificationCheckbox
		this.notification_enabled = checkbox.checked
	}
	render() {
		const { server } = this.props
		return (
			<div className="header">
				<div className="inside">
					<h1 className="header-title">{server.display_name}</h1>
					<div className="header-options">
						<p className="notification">通知<input type="checkbox" ref="notificationCheckbox" onChange={this.toggleNotification} /></p >
					</div>
				</div>
			</div>
		)
	}
}