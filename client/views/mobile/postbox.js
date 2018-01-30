import React, { Component } from "react"
import { request } from "../../api"

export default class PostboxView extends Component {
	post() {
		if (this.pending === true) {
			return
		}
		this.pending = true
		const textarea = this.refs.textarea
		const text = textarea.value
		if (text.length == 0) {
			alert("本文を入力してください")
			this.pending = false
			return
		}
		const query = { text }
		if (this.props.hashtag) {
			query.hashtag_id = this.props.hashtag.id
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
			})
			.catch(error => {
				alert(error)
			})
			.then(_ => {
				textarea.focus()
				this.pending = false
			})
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
						if (this.refs.textarea.value.length == 0) {
							this.refs.textarea.value = url
						} else {
							this.refs.textarea.value = this.refs.textarea.value + "\n" + url
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
		if (!this.props.logged_in) {
			return (
				<div>投稿するにはログインしてください</div>
			)
		}
		return (
			<div>
				<div><textarea ref="textarea" /></div>
				<div>
					<input type="file" ref="file" accept="image/*, video/*" onChange={e => this.onFileChange(e)} multiple />
					<button className="button" onTouchStart={e => this.post()}>投稿する</button>
					</div>
			</div>
		);
	}
}