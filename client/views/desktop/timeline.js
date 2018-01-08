import React, { Component } from "react"
import { inject, observer } from "mobx-react"
import StatusView from "./status"
import StatusStore from "../../stores/status"
import { request } from "../../api"
import ws from "../../websocket"
import * as notification from "../../notification"
import { setInterval } from "timers"

@observer
export default class TimelineView extends Component {
	componentDidMount() {
		ws.addEventListener("message", (e) => {
			const data = JSON.parse(e.data)
			if (data.status_updated) {
				const { status } = data
				const { timeline } = this.props
				if (timeline.statusBelongsTo(status)) {
					timeline.loadNewStatuses()
					if (this.notification_enabled) {
						let text = status.text
						if(text.length > 140){
							text = text.slice(0, 140)
						}
						notification.push("新しい投稿があります", {
							"body": `@${status.user.name}: ${text}`
						})
					}
				}
			}
		})
		setInterval(() => {
			this.props.timeline.loadNewStatuses()
		}, 30000)
	}
	toggleNotification(e) {
		const checkbox = this.refs.notificationCheckbox
		this.notification_enabled = checkbox.checked
	}
	render() {
		const timeline = this.props.timeline;
		return (
			<div className="timeline">
				<p className="notification">新着通知:<input type="checkbox" ref="notificationCheckbox" onChange={e => this.toggleNotification(e)} /></p >
				<div className="vertical"></div>
				{timeline.filteredStatuses.map((status) =>
					<StatusView status={status} key={status.id} />
				)}
			</div>
		)
	}
}