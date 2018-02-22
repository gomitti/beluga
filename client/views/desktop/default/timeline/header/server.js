import React, { Component } from "react"
import classnames from "classnames"
import Toggle from "react-toggle"
import ws from "../../../../../websocket"
import assert, { is_object } from "../../../../../assert"
import { ColumnStore } from "../../../../../stores/column"
import * as notification from "../../../../../notification"

export default class HeaderView extends Component {
	constructor(props) {
		super(props)
		const { server, column } = props
		assert(is_object(server), "@server must be object")
		assert(column instanceof ColumnStore, "@column must be an instance of ColumnStore")
		this.state = {
			"is_settings_hidden": true
		}
	}
	componentDidMount() {
		ws.addEventListener("message", (e) => {
			if (this.notification_enabled !== true) {
				return
			}
			const data = JSON.parse(e.data)
			if (data.status_updated) {
				const { status } = data
				const { column } = this.props
				if (column.timeline.statusBelongsTo(status)) {
					let text = status.text
					if (text.length > 140) {
						text = text.slice(0, 140)
					}
					notification.push("新しい投稿があります", {
						"body": `@${status.user.name}: ${text}`
					})
				}
			}
		})
	}
	toggleNotification = event => {
		this.notification_enabled = event.target.checked
	}
	toggleSettings = event => {
		event.preventDefault()
		this.setState({
			"is_settings_hidden": !this.state.is_settings_hidden
		})
	}
	render() {
		const { server, onBack, column } = this.props
		return (
			<div className="header">
				<div className="inside">
					<h1 className="header-title">
						{server.display_name}
						<div className="header-options">
							{column.history.length > 1 ? <a className="back-button" onClick={onBack}>戻る</a> : null}
							<button className={classnames("settings-button user-defined-color-active user-defined-color-hover", {
								"active": !this.state.is_settings_hidden
							})} onClick={this.toggleSettings}></button>
						</div>
					</h1>
					<div className={classnames("header-settings", {
						"hidden": this.state.is_settings_hidden
					})}>
						<section>
							<label className="form-react-toggle">
								<Toggle onChange={this.toggleNotification} />
								<span>デスクトップ通知</span>
							</label>
						</section>
						<section className="column-operations clearfix">
							<p className="move">
								<a className="left user-defined-color-hover"></a>
								<a className="right user-defined-color-hover"></a>
							</p>
						</section>
					</div>
				</div>
			</div>
		)
	}
}