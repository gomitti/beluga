import { Component } from "react"
import { observer } from "mobx-react"
import StatusView from "./status"

@observer
export default class TimelineView extends Component {
	render() {
		const { timeline, options, onClickHashtag, onClickMention } = this.props
		return (
			<div className="timeline-module">
				{timeline.filteredStatuses.map(status => {
					if(status.deleted){
						return null
					}
					return <StatusView status={status} key={status.id} options={options.status || {}} onClickHashtag={onClickHashtag} onClickMention={onClickMention} />
				})}
			</div>
		)
	}
}