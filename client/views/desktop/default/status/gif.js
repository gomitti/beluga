import React, { Component } from "react"

export default class GifView extends Component {
	constructor(props) {
		super(props)
		this.state = {
			"loaded": false,
			"pending": false,
			"display": false
		}
	}
	onLoad = event => {
		this.setState({
			"loaded": true,
			"pending": false,
			"display": true
		})
	}
	onMouseEnter = event => {
		this.setState({
			"display": true
		})
	}
	onMouseLeave = event => {
		this.setState({
			"display": false
		})
	}
	render() {
		const { width, height, coalesce_src, original_src } = this.props
		const src = this.state.display ? original_src : coalesce_src
		return (
			<div className="gifview" onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave} style={{ width, height }}>
				<span className="watermark">GIF</span>
				<a href={original_src} target="_blank">
					<img src={src} width={width} height={height} />
				</a>
			</div>
		)
	}
}