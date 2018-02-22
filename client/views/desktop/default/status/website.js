import React, { Component } from "react"

export default class WebsiteView extends Component {
	render() {
		let { domain, image, title, description, url, original_url } = this.props
		let imageView = null
		if (image) {
			imageView = <div className="image">
				<img src={image} />
			</div>
		}
		if (description && description.length > 80){
			description = description.substring(0, 80) + "…"
		}
		return (
			<div className="status-body-website">
				{imageView}
				<div className="content">
					<a className="title meiryo user-defined-color bold" href={url} target="_blank">{title}</a>
					<p className="domain verdana">{domain}</p>
					{description ? <div className="description meiryo">{description}</div> : null}
				</div>
			</div>
		)
	}
}