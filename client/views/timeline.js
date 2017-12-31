import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import StatusView from "./status"
import StatusStore from "../stores/status"
import { request } from "../api"
import ws from "../websocket"
import * as notification from "../notification"

@observer
export default class TimelineView extends Component {
	componentDidMount() {
		ws.addEventListener("message", (e) => {
			const data = JSON.parse(e.data)
			if (data.status_updated){
				this.props.timeline.loadNewStatuses()
				if (this.notification_enabled){
					notification.push("新しい投稿があります", {
						"body": ""
					})
				}
			}
		})
	}
	toggleNotification(e){
		const checkbox = this.refs.notificationCheckbox
		this.notification_enabled = checkbox.checked
	}
	render() {
		const timeline = this.props.timeline;
		return (
			<div>
				<p>新着通知:<input type="checkbox" ref="notificationCheckbox" onChange={e => this.toggleNotification(e)} /></p >
				{timeline.filteredStatuses.map((status) =>
					<StatusView status={status} />
				)}
			</div>
		);
	}
}