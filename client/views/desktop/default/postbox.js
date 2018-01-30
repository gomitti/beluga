import React, { Component } from "react"
import { request } from "../../../api"
const classnames = require("classnames")

export default class PostboxView extends Component {
	constructor(props) {
		super(props)
		this.state = {
			"is_ready": false,
			"show_media": false,
			"drag_entered": false
		}
	}
	componentDidMount() {
		const { textarea } = this.refs
		if (textarea) {
			textarea.focus()
		}

	}
	toggleMediaView(e) {
		e.preventDefault()
		this.setState({
			"show_media": !this.state.show_media
		})
	}
	appendEmoji(e) {
		e.preventDefault()
		const { x, y } = e.target.getBoundingClientRect()
		emojipicker.show(x, y + 40, shortname => {
			const { textarea } = this.refs
			this.setText(textarea.value + `:${shortname}:`)
		})
	}
	appendMedia(e, item) {
		e.preventDefault()
		const { textarea } = this.refs
		if (textarea.value.length === 0) {
			this.setText(`${item.source}`)
		} else {
			this.setText(textarea.value + "\n" + `${item.source}`)
		}
	}
	post(e) {
		if (e) {
			e.preventDefault()
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
		// ルームへの投稿
		if (this.props.hashtag) {
			query.hashtag_id = this.props.hashtag.id
		}
		// ユーザーのホームへの投稿
		if (this.props.recipient && this.props.server) {
			query.recipient_id = this.props.recipient.id
			query.server_id = this.props.server.id
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
	onKeyUp(e) {
		if (e.keyCode == 16) {
			this.is_shift_key_down = false
			return
		}
		if (e.keyCode == 17) {
			this.is_ctrl_key_down = false
			return
		}
	}
	onKeyDown(e) {
		if (e.keyCode == 16) {
			this.is_shift_key_down = true
			if (this.timer_shift) {
				clearTimeout(this.timer_shift)
			}
			this.timer_shift = setTimeout(function () {
				this.is_shift_key_down = false
			}.bind(this), 5000)
		}
		if (e.keyCode == 17) {
			this.is_ctrl_key_down = true
			if (this.timer_ctrl) {
				clearTimeout(this.timer_ctrl)
			}
			this.timer_ctrl = setTimeout(function () {
				this.is_ctrl_key_down = false
			}.bind(this), 5000)
		}
		if (e.keyCode == 13) {
			const { textarea } = this.refs
			if (this.is_shift_key_down) {
				e.preventDefault()
				this.post()
				return
			}
			if (this.is_ctrl_key_down) {
				e.preventDefault()
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
	onTextChange(e) {
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
	onDragOver(e) {
		if(this.state.drag_entered === false){
			this.setState({ "drag_entered": true })
		}
		if (window.chrome) {
			return true;
		}
		e.preventDefault()
	}
	onDragEnd(e) {
		if (this.state.drag_entered) {
			this.setState({ "drag_entered": false })
		}
	}
	onDrop(e) {
		const transfer = e.dataTransfer;
		if (!transfer) {
			return true;
		}
		const str = transfer.getData("text")	// テキストのドロップは無視
		if (str) {
			return true;
		}
		e.preventDefault();
		if (transfer.files.length == 0) {
			alert("ファイルを取得できません")
			return false;
		}
		for (const file of transfer.files) {
			const reader = new FileReader();
			reader.onload = (e) => {
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
	onFileChange(e) {
		const files = e.target.files
		for (const file of files) {
			const reader = new FileReader()
			reader.onload = (e) => {
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
		const { logged_in, media } = this.props
		if (!logged_in) {
			return (
				<div>投稿するには<a href="/login">ログイン</a>してください</div>
			)
		}
		const mediaViews = []
		if (media instanceof Array && this.state.show_media) {
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
					<a className="item" onClick={e => this.appendMedia(e, item)}>
						<img src={thumbnail} />
					</a>
				)
			}
		}
		return (
			<div className="postbox-module" onDragOver={e => this.onDragOver(e)} onDragEnd={e => this.onDragEnd(e)} onDragLeave={e => this.onDragEnd(e)} onDrop={e => this.onDrop(e)}>
				<div className="inside">
					<div className="postbox-left">
						<a href="/user/" className="avatar link">
							<img src={logged_in.profile_image_url} />
						</a>
					</div>
					<div className="postbox-right">
						<div className="postbox-content">
							<div className="body">
								<textarea onChange={e => this.onTextChange(e)} className={classnames("form-input user-defined-border-color-focus user-defined-border-color-drag-entered", { "drag-entered": this.state.drag_entered })} ref="textarea" onKeyUp={e => this.onKeyUp(e)} onKeyDown={e => this.onKeyDown(e)} />
							</div>
						</div>
						<div className="postbox-footer">
							<input type="file" ref="file" accept="image/*, video/*" onChange={e => this.onFileChange(e)} multiple />
							<div className="panel">
								<button className="action emojipicker-ignore-click" onClick={e => this.appendEmoji(e)}>✌️</button>
								<button className="action emojipicker-ignore-click" onClick={e => this.toggleMediaView(e)}>画</button>
								<button className="action emojipicker-ignore-click" onClick={e => this.appendEmoji(e)}>✌️</button>
							</div>
							<div className="submit">
								<button className={classnames("button meiryo", {
									"ready user-defined-bg-color": !this.state.is_pending && this.state.is_ready,
									"neutral": !this.state.is_pending && !this.state.is_ready,
									"in-progress": this.state.is_pending,
								})} onClick={e => this.post(e)}>投稿する</button>
							</div>
						</div>
						{(() => {
							if (mediaViews.length == 0) {
								return null
							}
							return (
								<div className="postbox-media">
									{mediaViews}
								</div>
							)
						})()}
					</div>
				</div>
			</div>
		)
	}
}