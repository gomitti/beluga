import React, { Component } from "react";
import { inject, observer } from "mobx-react";

@observer
export default class StatusView extends Component {
	onClick(){
		this.props.status.incrementLikes()
	}
	render() {
		const status = this.props.status;
		return (
			<div>
				<p className="name">@{status.user.name}</p>
				<p className="body">{status.text}</p>
			</div>
		);
	}
}