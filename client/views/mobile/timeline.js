import React, { Component } from "react"
import { observer } from "mobx-react"
import StatusView from "./status"

@observer
export default class TimelineView extends Component {
	render() {
		const { timeline } = this.props
		return (
			<div className="timeline mobile">
				<div className="vertical"></div>
				{timeline.filteredStatuses.map(status => {
					if (status.deleted) {
						return null
					}
					return <StatusView status={status} key={status.id} />
				})}
			</div>
		)
	}
}