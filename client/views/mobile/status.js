import React, { Component } from "react"
import { inject, observer } from "mobx-react"
import VideoView from "../desktop/default/status/video"
import { preprocess_text } from "../desktop/default/status"
import config from "../../beluga.config"
import parse from "../desktop/default/parser"
import ReactionsView from "./reactions"

class ImageView extends Component {
	constructor(props) {
		super(props)
		this.state = {}
	}
	onLoad = event => {
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
		return <img ref="img" src={this.props.src} onLoad={this.onLoad} width="0" height="0" />
	}
}

@observer
export default class StatusView extends Component {
	toggleFavorite = event => {
		event.preventDefault()
		const { status } = this.props
		if (status.favorited) {
			status.favorites.destroy()
		} else {
			status.favorites.create()
		}
	}
	createLike = event => {
		event.preventDefault()
		const { status } = this.props
		status.likes.increment()
	}
	destroy = event => {
		event.preventDefault()
		const { status } = this.props
		status.destroy()
	}
	render() {
		const { status } = this.props
		const bodyView = []
		const body = preprocess_text(status.text)
		for (const contents of body) {
			if (typeof contents === "string") {
				bodyView.push(<p>{parse(contents, status, {})}</p>)
				continue
			}
			if (contents instanceof Array) {
				if (contents.length <= 2) {
					const imageViews = []
					for (const image_source of contents) {
						const nodes = parse(image_source, status, {})
						for (const view of nodes) {
							imageViews.push(view)
						}
					}
					bodyView.push(<div className="status-body-gallery">{imageViews}</div>)
					continue
				}
				const div = parseInt(Math.ceil(contents.length / 2))
				for (let n = 0; n < div; n++) {
					const end = Math.min((n + 1) * 2, contents.length)
					const subset = contents.slice(n * 2, end)
					const imageViews = []
					for (const image_source of subset) {
						const nodes = parse(image_source, status, {})
						for (const view of nodes) {
							imageViews.push(view)
						}
					}
					bodyView.push(<div className="status-body-gallery">{imageViews}</div>)
				}
			}
		}

		let likesView = null
		if (status.likes.count > 0) {
			const starViews = []
			for (let i = 0; i < status.likes.count; i++) {
				starViews.push(<p></p>)
			}
			likesView = <div className="status-likes">{starViews}</div>
		}

		let favoritesView = null
		if (status.favorites.count > 0) {
			const userViews = []
			for (const user of status.favorites.users) {
				userViews.push(
					<a href={`/user/${user.name}`} target="_blank">
						<img src={user.avatar_url} />
					</a>
				)
			}
			favoritesView = <div className="status-favofites">
				<div className="users">
					{userViews}
				</div>
				<div className="meta">
					<span className="sep"></span>
					<span className="count verdana">{status.favorites.count}</span>
					<span className="unit meiryo">ふぁぼ</span>
				</div>
			</div>
		}
		return (
			<div className="status">
				<div className="inside">
					<div className="header">
						<a href="/user/" className="avatar">
							<span className="name">@{status.user.name}</span>
							<img src={status.user.avatar_url} />
						</a>
					</div>
					<div className="content">
						<div className="body">{bodyView}</div>
					</div>
					{likesView}
					{favoritesView}
					<ReactionsView status={status} />
					<div className="status-action" ref="action">
						<div className="inside">
							<button className="like user-defined-color-hover"
								onTouchStart={event => {
									this.should_tap_like = true
								}}
								onTouchMove={event => {
									this.should_tap_like = false
								}}
								onTouchCancel={event => {
									this.should_tap_like = false
								}}
								onTouchEnd={event => {
									if (this.should_tap_like) {
										this.createLike(event)
									}
								}}></button>
							<button className="favorite user-defined-color-hover"
								onTouchStart={event => {
									this.should_tap_favorite = true
								}}
								onTouchMove={event => {
									this.should_tap_favorite = false
								}}
								onTouchCancel={event => {
									this.should_tap_favorite = false
								}}
								onTouchEnd={event => {
									if (this.should_tap_favorite) {
										this.toggleFavorite(event)
									}
								}}></button>
							<button className="comment user-defined-color-hover"></button>
							<button className="destroy user-defined-color-hover"
								onTouchStart={event => {
									this.should_tap_destroy = true
								}}
								onTouchMove={event => {
									this.should_tap_destroy = false
								}}
								onTouchCancel={event => {
									this.should_tap_destroy = false
								}}
								onTouchEnd={event => {
									if (this.should_tap_destroy) {
										this.destroy(event)
									}
								}}></button>
						</div>
					</div>
				</div>
			</div>
		);
	}
}