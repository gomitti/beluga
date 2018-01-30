import React, { Component } from "react"
import { inject, observer } from "mobx-react"
import StatusView from "./status"
import StatusStore from "../../../stores/status"
import { request } from "../../../api"
import ws from "../../../websocket"
import * as notification from "../../../notification"

@observer
export default class TimelineView extends Component {
	render() {
		const { timeline, options } = this.props
		return (
			<div className="timeline-module">
				{timeline.filteredStatuses.map(status => {
					if(status.deleted){
						return null
					}
					return <StatusView status={status} key={status.id} options={options.status || {}} />
				})}
			</div>
		)
	}
}