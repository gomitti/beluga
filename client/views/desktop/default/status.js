import React, { Component } from "react"
import { observer } from "mobx-react"
import config from "../../../beluga.config"
import parse from "./status/parser"
import ReactionsView from "./status/reactions"
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

@observer
export default class StatusView extends Component {
	constructor(props) {
		super(props)
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
	onMouseEnter = event => {
		const footer = this.refs.footer
		const action = this.refs.action
		action.style.top = `${footer.offsetTop - 3}px`
	}
	onMouseLeave = event => {
		const footer = this.refs.footer
	}
	toggleFavorite = event => {
		event.preventDefault()
		const { status } = this.props
		if(status.favorited){
			status.favorites.destroy()
		}else{
			status.favorites.create()
		}
	}
	createLike = event => {
		event.preventDefault()
		const { status } = this.props
		status.likes.increment()
	}
	addReaction = event => {
		event.preventDefault()
		const { status } = this.props
		const { x, y } = event.target.getBoundingClientRect()
		emojipicker.show(x, y, shortname => {
			status.reactions.add(shortname)
		})
	}
	destroy = event => {
		event.preventDefault()
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
		for (const sentence of lines) {
			lineViews.push(<p>{parse(sentence)}</p>)
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
						<img src={user.profile_image_url} />
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

		let belongingLink = null
		const { server, hashtag, recipient } = status
		if (options.show_belonging) {
			if (hashtag && server) {
				belongingLink = <a href={`/server/${server.name}/${hashtag.tagname}`} className="belonging hashtag meiryo">#{hashtag.tagname}</a>
			}
			if (recipient && server) {
				belongingLink = <a href={`/server/${server.name}/@${recipient.name}`} className="belonging recipient meiryo">@{recipient.name}</a>
			}
		}
		return (
			<div className="status" onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
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
									{user.display_name ? <span className="display-name">{user.display_name}</span> : null}
									<span className="name verdana">@{user.name}</span>
								</a>
								<a href={`/status/${user.name}/${status.id}`} className="time meiryo">{this.state.elapsed_time_str}</a>
							</div>
						</div>
						<div className="status-content">
							<div className="body">{lineViews}</div>
						</div>
						{likesView}
						{favoritesView}
						<ReactionsView status={status} />
						<div className="status-footer" ref="footer">
							{belongingLink}
							<a href={`/status/${user.name}/${status.id}`} className="time verdana">{this.state.created_at_str}</a>
						</div>
					</div>
					<div className="status-action" ref="action">
						<div className="inside">
							<button className="like user-defined-color-hover" onClick={this.createLike}></button>
							<button className="favorite user-defined-color-hover" onClick={this.toggleFavorite}></button>
							<button className="emoji emojipicker-ignore-click user-defined-color-hover" onClick={this.addReaction}></button>
							<button className="comment user-defined-color-hover"></button>
							<button className="destroy user-defined-color-hover" onClick={this.destroy}></button>
						</div>
					</div>
				</div>
			</div>
		);
	}
}