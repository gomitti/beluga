import React, { Component } from "react"

export class PostboxMediaView extends Component {
	render() {
		const { media, is_hidden, append } = this.props
		if (is_hidden) {
			return null
		}
		const mediaViews = []
		if (media instanceof Array) {
			const num_per_row = 8
			const rows = []
			const num_rows = Math.ceil(media.length / num_per_row)
			for (let y = 0; y < num_rows;y++){
				rows.push(media.slice(y * num_per_row, Math.min((y + 1) * num_per_row, media.length)))
			}
			for (const row of rows) {
				const views = []
				for(const item of row){
					let thumbnail = null
					if (item.is_image) {
						thumbnail = `${item.uri}/${item.directory}/${item.suffix}.square.${item.extension}`
					} else if (item.is_video) {
						thumbnail = `${item.uri}/${item.directory}/${item.suffix}.square.jpg`
					}
					if (!thumbnail) {
						continue
					}
					views.push(
						<a className="item" onClick={event => append(event, item)}>
							<img src={thumbnail} />
						</a>
					)
				}
				mediaViews.push(
					<div className="row">{views}</div>
				)
			}
		}
		if (mediaViews.length == 0) {
			return (
				<div className="postbox-media history no-media">
					<a href="/settings/favorites" className="user-defined-color bold">画像を登録</a>するとここに表示されます
				</div>
			)
		}
		return (
			<div className="postbox-media history scroller-wrapper">
				<div className="scroller">
					{mediaViews}
				</div>
			</div>
		)
	}
}