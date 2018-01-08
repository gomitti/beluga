import React, { Component } from "react";
import { inject, observer } from "mobx-react";

@observer
export default class StatusView extends Component {
	render() {
		const status = this.props.status
		const lines = status.text.split("\n")
		const lineViews = []
		for (const str of lines) {
			const components = str.split(/(https?:\/\/[^\s ]+)/)
			const subViews = []
			for (const substr of components) {
				if (substr.indexOf("http") === 0) {
					subViews.push(<a href={substr} target="_blank">{substr}</a>)
				} else {
					subViews.push(<span>{substr}</span>)
				}
			}
			lineViews.push(<p>{subViews}</p>)
		}
		return (
			<div>
				<p className="name">@{status.user.name}</p>
				<div className="body">{lineViews}</div>
			</div>
		);
	}
}