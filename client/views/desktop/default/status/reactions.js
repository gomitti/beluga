import React, { Component } from "react"
import { observer } from "mobx-react"
import config from "../../../../beluga.config"
import { map_shortname_fname } from "./parser/emoji"

@observer
export default class ReactionsView extends Component {
	add(shortname) {
		const { status } = this.props
		status.reactions.add(shortname)
	}
	render() {
		const { status } = this.props
		if (status.reactions.count == 0) {
			return null
		}
		const buttons = []
		for (const shortname in status.reactions.list) {
			const fname = map_shortname_fname[`:${shortname}:`]
			if (!fname){
				continue
			}
			const count = status.reactions.list[shortname]
			buttons.push(
				<button className="status-reaction" onClick={e => this.add(shortname)}>
					<img className="emoji" src={`/asset/emoji/64x64/${fname}.png`} />
					<span className="count">{count}</span>
				</button>
			)
		}
		return (
			<div className="status-reactions">
				{buttons}
			</div>
		)
	}
}