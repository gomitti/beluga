import React, { Component } from "react"
import config from "../../../../beluga.config"

export default class ImageView extends Component {
	constructor(props) {
		super(props)
		this.state = {}
	}
	onLoad(e) {
		const img = this.refs.img
		if (img) {
			const max_size = config.status.image.max_size.desktop
			const width = img.naturalWidth || img.width
			const height = img.naturalHeight || img.height
			let ratio = 1
			if (Math.max(width, height) > max_size) {
				ratio = max_size / Math.max(width, height)
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
		// <div>で囲むとonLoadが正しく呼ばれる謎
		return (
			<div>
				<img ref="img" onLoad={e => this.onLoad(e)} src={this.props.src} width="0" height="0" />
			</div>
		)
	}
}