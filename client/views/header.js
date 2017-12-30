import React, { Component } from "react";
import { observer } from "mobx-react";
import { observable, action } from "mobx";
import ws from "../websocket"

@observer
export default class HeaderView extends Component {
	@observable online = 0

	@action.bound
	setOnline(count){
		this.online = count
	}
	componentDidMount() {
		ws.addEventListener("message", (e) => {
			const data = JSON.parse(e.data)
			if(data.online){
				this.setOnline(data.online)
			}
		})
	}
	render() {
		const timeline = this.props.timeline;
		return (
			<div>
				<p>オンライン:{this.online}</p>
			</div>
		);
	}
}