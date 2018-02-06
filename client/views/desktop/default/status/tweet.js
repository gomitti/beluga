import React, { Component } from "react"

export default class TweetView extends Component {
	onLoad = event => {
		const iframe = this.refs.iframe
		if (!iframe) {
			return
		}
		this.retry = 0
		this.timer = setInterval(() => {
			const num_elements = iframe.contentDocument.body.childElementCount
			this.retry += 1
			if(this.retry > 20){
				clearInterval(this.timer)
			}
			if (num_elements != 4) {
				return
			}
			let height = iframe.contentWindow.document.documentElement.scrollHeight
			if (typeof height === "number" && height > iframe.height) {
				iframe.height = height;
			}
		}, 200)
	}
	render() {
		const { src } = this.props
		return (
			<iframe scrolling="no" frameBorder="no" src={src} onLoad={this.onLoad} ref="iframe"></iframe>
		)
	}
}