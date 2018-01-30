import React, { Component } from "react"

export default class VideoView extends Component {
	render() {
		const { width, height, src, poster } = this.props
		return <video className="status-body-video" ref="img" src={src} width={width} height={height} poster={poster} controls />
	}
}