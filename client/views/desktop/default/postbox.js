import React, { Component } from "react"
import assert from "../../../assert"
import { request } from "../../../api"
import { PostboxMediaView } from "./postbox/media"
import classnames from "classnames"

export default class PostboxView extends Component {
	constructor(props) {
		super(props)
		this.state = {
			"is_ready": false,
			"show_media_favorites": false,
			"drag_entered": false
		}
	}
	componentDidMount() {
		const { textarea } = this.refs
		if (textarea) {
			textarea.focus()
		}

	}
	toggleMediaView = event => {
		event.preventDefault()
		this.setState({
			"show_media_favorites": !this.state.show_media_favorites
		})
	}
	toggleEmojiPicker = event => {
		event.preventDefault()
		const { x, y } = event.target.getBoundingClientRect()
		if (emojipicker.is_hidden) {
			emojipicker.show(x, y + 40, shortname => {
				const { textarea } = this.refs
				this.setText(textarea.value + `:${shortname}:`)
			})
		} else {
			emojipicker.hide()
		}
	}
	appendMediaLink = (event, item) => {
		event.preventDefault()
		const { textarea } = this.refs
		if (textarea.value.length === 0) {
			this.setText(`${item.source}`)
		} else {
			this.setText(textarea.value + "\n" + `${item.source}`)
		}
	}
	post = event => {
		if (event) {
			event.preventDefault()
		}
		if (this.pending === true) {
			return
		}
		this.setState({ "is_pending": true })
		const { textarea } = this.refs
		const text = textarea.value
		if (text.length == 0) {
			alert("本文を入力してください")
			this.setState({ "is_pending": false, "is_ready": false })
			return
		}
		const query = { text }
		const { hashtag, recipient, server } = this.props
		if (hashtag) {	// ルームへの投稿
			query.hashtag_id = hashtag.id
		} else if (recipient && server) {	// ユーザーのホームへの投稿
			query.recipient_id = recipient.id
			query.server_id = server.id
		} else {
			assert(false, "Invalid post target")
		}

		request
			.post("/status/update", query)
			.then(res => {
				const data = res.data
				if (data.success == false) {
					alert(data.error)
					return
				}
				textarea.value = ""
				this.setState({ "is_pending": false, "is_ready": false })
			})
			.catch(error => {
				alert(error)
				this.setState({ "is_pending": false, "is_ready": true })
			})
			.then(_ => {
				textarea.focus()
			})
	}
	onKeyUp = event => {
		if (event.keyCode == 16) {
			this.is_shift_key_down = false
			return
		}
		if (event.keyCode == 17) {
			this.is_ctrl_key_down = false
			return
		}
	}
	onKeyDown = event => {
		if (event.keyCode == 16) {
			this.is_shift_key_down = true
			if (this.timer_shift) {
				clearTimeout(this.timer_shift)
			}
			this.timer_shift = setTimeout(function () {
				this.is_shift_key_down = false
			}.bind(this), 5000)
		}
		if (event.keyCode == 17) {
			this.is_ctrl_key_down = true
			if (this.timer_ctrl) {
				clearTimeout(this.timer_ctrl)
			}
			this.timer_ctrl = setTimeout(function () {
				this.is_ctrl_key_down = false
			}.bind(this), 5000)
		}
		if (event.keyCode == 13) {
			const { textarea } = this.refs
			if (this.is_shift_key_down) {
				event.preventDefault()
				this.post()
				return
			}
			if (this.is_ctrl_key_down) {
				event.preventDefault()
				this.post()
				return
			}
			return
		}
	}
	setText(str) {
		const { textarea } = this.refs
		textarea.value = str
		if (str.length === 0) {
			return this.setState({
				"is_ready": false
			})
		}
		this.setState({
			"is_ready": true
		})
	}
	onTextPaste = event => {
		const { target, clipboardData } = event
		console.dir(target)
		console.log(clipboardData)
		const data = clipboardData.getData("Text")
		if (!data.match(/^https?:\/\/[^\s ]+$/)){
			return
		}
		event.preventDefault()
		let prefix = ""
		if(window.confirm("リンク先のプレビューを有効にしますか？")){
			prefix = "!"
		}
		const position = target.selectionStart
		console.log(position, data)
		if(position === 0){
			if(target.value.length === 0){
				target.value = prefix + data
				return
			}
			target.value = prefix + data + "\n" + target.value
			return
		}
		if(position === target.value.length){
			target.value = target.value + "\n" + prefix + data
			return
		}
		target.value = target.value.substring(0, position) + "\n" + prefix + data + "\n" + target.value.substring(position)
	}
	onTextChange = event => {
		const { textarea } = this.refs
		if (textarea.value.length === 0 && this.state.is_ready === true) {
			return this.setState({
				"is_ready": false
			})
		}
		if (textarea.value.length >= 0 && this.state.is_ready === false) {
			return this.setState({
				"is_ready": true
			})
		}
	}
	onDragOver = event => {
		if (this.state.drag_entered === false) {
			this.setState({ "drag_entered": true })
		}
		if (window.chrome) {
			return true;
		}
		event.preventDefault()
	}
	onDragEnd = event => {
		if (this.state.drag_entered) {
			this.setState({ "drag_entered": false })
		}
	}
	onDrop = event => {
		const transfer = event.dataTransfer;
		if (!transfer) {
			return true;
		}
		const str = transfer.getData("text")	// テキストのドロップは無視
		if (str) {
			return true;
		}
		event.preventDefault();
		if (transfer.files.length == 0) {
			alert("ファイルを取得できません")
			return false;
		}
		for (const file of transfer.files) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const endpoint = reader.result.indexOf("data:video") === 0 ? "/media/video/upload" : "/media/image/upload"
				request
					.post(endpoint, {
						"data": reader.result
					})
					.then(res => {
						const data = res.data
						if (data.error) {
							alert(data.error)
							return
						}
						const url = data.urls.original
						const { textarea } = this.refs
						if (textarea.value.length == 0) {
							this.setText(url)
						} else {
							this.setText(textarea.value + "\n" + url)
						}
					})
					.catch(error => {
						alert(error)
					})
					.then(_ => {
					})
			}
			reader.readAsDataURL(file)
		}
	}
	onFileChange = event => {
		const files = event.target.files
		for (const file of files) {
			const reader = new FileReader()
			reader.onload = (event) => {
				const endpoint = reader.result.indexOf("data:video") === 0 ? "/media/video/upload" : "/media/image/upload"
				request
					.post(endpoint, {
						"data": reader.result
					})
					.then(res => {
						const data = res.data
						if (data.error) {
							alert(data.error)
							return
						}
						const url = data.urls.original
						const { textarea } = this.refs
						if (textarea.value.length == 0) {
							this.setText(url)
						} else {
							this.setText(textarea.value + "\n" + url)
						}
					})
					.catch(error => {
						alert(error)
					})
					.then(_ => {
					})
			}
			reader.readAsDataURL(file)
		}
	}
	render() {
		const { logged_in, media_favorites, media_history } = this.props
		if (!logged_in) {
			return (
				<div>投稿するには<a href="/login">ログイン</a>してください</div>
			)
		}
		return (
			<div className="postbox-module" onDragOver={this.onDragOver} onDragEnd={this.onDragEnd} onDragLeave={this.onDragEnd} onDrop={this.onDrop}>
				<div className="inside">
					<div className="postbox-left">
						<a href="/user/" className="avatar link">
							<img src={logged_in.avatar_url} />
						</a>
					</div>
					<div className="postbox-right">
						<div className="postbox-content">
							<div className="body">
								<textarea
									className={classnames("form-input user-defined-border-color-focus user-defined-border-color-drag-entered", { "drag-entered": this.state.drag_entered })}
									ref="textarea"
									onChange={this.onTextChange}
									onPaste={this.onTextPaste}
									onKeyUp={this.onKeyUp}
									onKeyDown={this.onKeyDown} />
							</div>
						</div>
						<div className="postbox-footer">
							<input type="file" ref="file" accept="image/*, video/*" onChange={this.onFileChange} multiple />
							<div className="panel">
								<button className="action emojipicker-ignore-click" onClick={this.toggleEmojiPicker}>✌️</button>
								<button className="action emojipicker-ignore-click" onClick={this.toggleMediaView}>画</button>
								<button className="action emojipicker-ignore-click" onClick={this.toggleEmojiPicker}>✌️</button>
							</div>
							<div className="submit">
								<button className={classnames("button meiryo", {
									"ready user-defined-bg-color": !this.state.is_pending && this.state.is_ready,
									"neutral": !this.state.is_pending && !this.state.is_ready,
									"in-progress": this.state.is_pending,
								})} onClick={this.post}>投稿する</button>
							</div>
						</div>
						{media_favorites ? <PostboxMediaView is_hidden={!this.state.show_media_favorites} media={media_favorites} append={this.appendMediaLink} /> : null}
					</div>
				</div>
			</div>
		)
	}
}