import React, { Component } from "react"
import { inject, observer } from "mobx-react"
import VideoView from "../desktop/default/status/video"
import config from "../../beluga.config"
import parse from "../desktop/default/status/parser"

class ImageView extends Component {
	constructor(props) {
		super(props)
		this.state = {}
	}
	onLoad(e) {
		const img = this.refs.img
		if (img) {
			const max_size = config.status.image.max_size.mobile
			const max_width = Math.min(max_size, (typeof window !== "undefined") ? window.innerWidth : max_size) - 60
			const width = img.naturalWidth || img.width
			const height = img.naturalHeight || img.height
			let ratio = 1
			if (Math.max(width, height) > max_size) {
				ratio = max_size / Math.max(width, height)
			}
			if (width * ratio > max_width) {
				ratio *= max_width / (width * ratio)
			}
			const dom_width = width * ratio
			const dom_height = height * ratio
			this.setState({
				"width": dom_width,
				"height": dom_height
			})
		}
	}
	render() {
		if (this.state.width && this.state.height) {
			return <img src={this.props.src} width={this.state.width} height={this.state.height} />
		}
		return <img ref="img" src={this.props.src} onLoad={e => this.onLoad(e)} width="0" height="0" />
	}
}


@observer
export default class StatusView extends Component {
	render() {
		const status = this.props.status
		const lines = status.text.split("\n")
		const lineViews = []
		for (const sentence of lines) {
			lineViews.push(<p>{parse(sentence)}</p>)
		}
		return (
			<div className="status">
				<div className="inside">
					<div className="header">
						<a href="/user/" className="avatar">
							<span className="name">@{status.user.name}</span>
							<img src={status.user.profile_image_url} />
						</a>
					</div>
					<div className="content">
						<div className="body">{lineViews}</div>
					</div>
				</div>
			</div>
		);
	}
}