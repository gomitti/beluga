import React, { Component } from "react"
import { inject, observer } from "mobx-react"
import config from "../../../beluga.config"
import { request } from "../../../api"

function created_at_to_elapsed_time(created_at) {
	let diff = Math.floor((Date.now() - created_at) / 1000)
	if (diff < 60) {
		return diff + "秒前"
	}
	diff = Math.floor(diff / 60)
	if (diff < 59) {
		return diff + "分前"
	}
	diff = Math.floor(diff / 60)
	if (diff < 24) {
		return diff + "時間前"
	}
	diff = Math.floor(diff / 24)
	if (diff < 7) {
		return diff + "日前"
	}
	diff = Math.floor(diff / 7)
	if (diff < 52) {
		return diff + "週前"
	}
	diff = Math.floor(diff / 52)
	return diff + "年前"
}

function time_from_create_at(created_at) {
	const date = new Date(created_at)
	const hours = date.getHours();
	const minutes = "0" + date.getMinutes();
	const formatted_time = hours + ":" + minutes.substr(-2)
	return formatted_time
}

class ImageView extends Component {
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
		return <img ref="img" src={this.props.src} onLoad={e => this.onLoad(e)} width="0" height="0" />
	}
}

@observer
export default class StatusView extends Component {
	constructor(props) {
		super(props);
		const { status } = props
		this.state = {
			"elapsed_time_str": created_at_to_elapsed_time(status.created_at),
			"created_at_str": time_from_create_at(status.created_at)
		}
	}
	componentDidMount() {
		// const footer = this.refs.footer
		// const action = this.refs.action
		// action.style.top = `${footer.offsetTop - 6}px`
		this.updateTime()
	}
	onMouseEnter(e) {
		const footer = this.refs.footer
		const action = this.refs.action
		action.style.top = `${footer.offsetTop - 6}px`
	}
	onMouseLeave(e) {
		const footer = this.refs.footer
	}
	createLike(e) {
		e.preventDefault()
		const { status } = this.props
		status.likes.increment()
	}
	destroy(e) {
		e.preventDefault()
		const { status } = this.props
		status.destroy()
	}
	updateTime() {
		const { status } = this.props
		const base = Date.now()
		let diff = (base - status.created_at) / 1000
		let new_interval = 3600
		if (diff < 60) {
			new_interval = 5
		} else if (diff < 3600) {
			new_interval = 60
		} else {
			new_interval = 1800
		}
		clearInterval(this._update_time)
		this._update_time = setInterval(() => {
			this.updateTime()
		}, new_interval * 1000)
		this.setState({
			"elapsed_time_str": created_at_to_elapsed_time(status.created_at),
			"created_at_str": time_from_create_at(status.created_at)
		})
	}
	render() {
		const { status, options } = this.props
		const { user } = status
		const lines = status.text.split("\n")
		const lineViews = []
		const is_server_side = typeof window === "undefined"
		for (const str of lines) {
			const components = str.split(/(https?:\/\/[^\s ]+)/)
			const subViews = []
			for (const substr of components) {
				if (substr.indexOf("http") === 0) {
					const url = substr
					if (url.match(/\.(jpg|jpeg|png|gif)$/)) {
						const max_size = config.status.image.max_size.desktop
						let parts = url.match(/(.+)\/([0-9]+)-([0-9]+)\.(jpg|jpeg|png|gif)/)
						if (parts) {
							const prefix = parts[1]
							const width = parts[2]
							const height = parts[3]
							let ratio = 1
							if (Math.max(width, height) > max_size) {
								ratio = max_size / Math.max(width, height)
							}
							const dom_width = width * ratio
							const dom_height = height * ratio
							const ext = parts[4]
							const href = url
							const src = `${prefix}/${width}-${height}.small.${ext}`
							if (is_server_side) {
								subViews.push(<a href={href} target="_blank"></a>)
								continue
							}
							subViews.push(<a href={href} target="_blank"><img src={src} width={dom_width} height={dom_height} /></a>)
							continue
						}
						parts = url.match(/(.+)\/([0-9]+)-([0-9]+)\.medium\.(jpg|jpeg|png|gif)/)
						if (parts) {
							const prefix = parts[1]
							const width = parts[2]
							const height = parts[3]
							let ratio = 1
							if (Math.max(width, height) > max_size) {
								ratio = max_size / Math.max(width, height)
							}
							const dom_width = width * ratio
							const dom_height = height * ratio
							const ext = parts[4]
							const href = url
							const src = `${prefix}/${width}-${height}.small.${ext}`
							if (is_server_side) {
								subViews.push(<a href={href} target="_blank"></a>)
								continue
							}
							subViews.push(<a href={href} target="_blank"><img src={src} width={dom_width} height={dom_height} /></a>)
							continue
						}
						parts = url.match(/(.+)\/([0-9]+)-([0-9]+)\.small\.(jpg|jpeg|png|gif)/)
						if (parts) {
							const prefix = parts[1]
							const width = parts[2]
							const height = parts[3]
							let ratio = 1
							if (Math.max(width, height) > max_size) {
								ratio = max_size / Math.max(width, height)
							}
							const dom_width = width * ratio
							const dom_height = height * ratio
							const ext = parts[4]
							const href = url
							const src = url
							if (is_server_side) {
								subViews.push(<a href={href} target="_blank"></a>)
								continue
							}
							subViews.push(<a href={href} target="_blank"><img src={src} width={dom_width} height={dom_height} /></a>)
							continue
						}
						if (is_server_side) {
							subViews.push(<a href={url} target="_blank"></a>)
							continue
						}
						subViews.push(<a href={url}><ImageView src={url} /></a>)
						continue
					}
					subViews.push(<a href={url} target="_blank">{url}</a>)
				} else {
					subViews.push(<span>{substr}</span>)
				}
			}
			lineViews.push(<p>{subViews}</p>)
		}
		let likesView = null
		if (status.likes.count > 0) {
			const starViews = []
			for (let i = 0; i < status.likes.count; i++) {
				starViews.push(<p></p>)
			}
			likesView = <div className="status-likes">{starViews}</div>
		}
		return (
			<div className="status" onMouseEnter={e => this.onMouseEnter(e)} onMouseLeave={e => this.onMouseLeave(e)}>
				<div className="inside">
					<div className="status-left">
						<a href="/user/" className="avatar link">
							<img src={user.profile_image_url} />
						</a>
					</div>
					<div className="status-right">
						<div className="status-header">
							<div className="inside">
								<a href="/user/" className="avatar link">
									{(() => {
										if (user.display_name) {
											return <span className="display-name">{user.display_name}</span>
										}
									})()}
									<span className="name verdana">@{user.name}</span>
								</a>
								<a href={`/status/${user.name}/${status.id}`} className="time meiryo">{this.state.elapsed_time_str}</a>
							</div>
						</div>
						<div className="status-content">
							<div className="body">{lineViews}</div>
						</div>
						{likesView}
						<div className="status-footer" ref="footer">
							{(() => {
								const { server, hashtag, recipient } = status
								if (options.show_belonging) {
									if (hashtag && server) {
										return <a href={`/server/${server.name}/${hashtag.tagname}`} className="belonging hashtag meiryo">#{hashtag.tagname}</a>
									}
									if (recipient && server) {
										return <a href={`/server/${server.name}/@${recipient.name}`} className="belonging recipient meiryo">@{recipient.name}</a>
									}
								}
							})()}
							<a href={`/status/${user.name}/${status.id}`} className="time verdana">{this.state.created_at_str}</a>
						</div>
					</div>
					<div className="status-action" ref="action">
						<div className="inside">
							<button onClick={e => this.createLike(e)}>い</button>
							<button>ふ</button>
							<button onClick={e => this.destroy(e)}>さ</button>
							<button>あ</button>
							<button>あ</button>
						</div>
					</div>
				</div>
			</div>
		);
	}
}