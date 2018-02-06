import React, { Component } from "react"

export default class PostboxMediaHistoryView extends Component {
	render() {
		const { media, isHidden, append } = this.props
		if(isHidden){
			return null
		}
		const mediaViews = []
		if (media instanceof Array) {
			for (const item of media) {
				let thumbnail = null
				if (item.is_image) {
					thumbnail = `${item.uri}/${item.directory}/${item.suffix}.square.${item.extension}`
				} else if (item.is_video) {
					thumbnail = `${item.uri}/${item.directory}/${item.suffix}.square.jpg`
				}
				if (!thumbnail) {
					continue
				}
				mediaViews.push(
					<a className="item" onClick={event => append(event, item)}>
						<img src={thumbnail} />
					</a>
				)
			}
		}
		if (mediaViews.length == 0) {
			return null
		}
		return (
			<div className="postbox-media history">
				{mediaViews}
			</div>
		)
	}
}