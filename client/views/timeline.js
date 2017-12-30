import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import StatusView from "./status"
import StatusStore from "../stores/status"
import { request } from "../api"
import ws from "../websocket"

@observer
export default class TimelineView extends Component {
	componentDidMount() {
		ws.addEventListener("message", (e) => {
			const data = JSON.parse(e.data)
			if (data.status_updated){
				this.props.timeline.loadNewStatuses()
			}
		})
	}
	render() {
		const timeline = this.props.timeline;
		return (
			<div>
				{timeline.filteredStatuses.map((status) =>
					<StatusView status={status} />
				)}
			</div>
		);
	}
}