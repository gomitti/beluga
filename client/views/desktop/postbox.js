import React, { Component } from "react";
import { request } from "../../api"

export default class PostboxView extends Component {
	post() {
		if (this.pending === true) {
			return
		}
		this.pending = true
		const textarea = this.refs.textarea
		const text = textarea.value
		if(text.length == 0){
			alert("本文を入力してください")
			this.pending = false
			return
		}
		const query = {
			text,
			"csrf_token": this.props.csrf_token
		}
		if(this.props.hashtag){
			query.hashtag_id = this.props.hashtag.id
		}
		request
			.post("/status/update", query)
			.then(res => {
				const data = res.data
				if(data.success == false){
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
			let textarea = this.refs.textarea
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

	render() {
		if (!this.props.logged_in){
			return (
				<div>投稿するにはログインしてください</div>
			)
		}
		return (
			<div>
				<div><textarea ref="textarea" onKeyUp={e => this.onKeyUp(e)} onKeyDown={e => this.onKeyDown(e)} /></div>
				<div><button className="button" onClick={e => this.post()}>投稿する</button></div>
			</div>
		);
	}
}