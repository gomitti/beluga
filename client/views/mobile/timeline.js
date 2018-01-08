import React, { Component } from "react"
import { inject, observer } from "mobx-react"
import StatusView from "./status"
import StatusStore from "../../stores/status"
import { request } from "../../api"
import ws from "../../websocket"
import * as notification from "../../notification"

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
				}
			}
		})
		setInterval(() => {
			this.props.timeline.loadNewStatuses()
		}, 30000)
	}
	toggleNotification(e){
		const checkbox = this.refs.notificationCheckbox
		this.notification_enabled = checkbox.checked
	}
	render() {
		const timeline = this.props.timeline;
		return (
			<div className="timeline mobile">
				<div className="vertical"></div>
				{timeline.filteredStatuses.map((status) =>
					<StatusView status={status} key={status.id} />
				)}
			</div>
		);
	}
}