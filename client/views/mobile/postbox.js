import React, { Component } from "react";
import { request } from "../../api"

export default class PostboxView extends Component {
	post(){
		if(this.pending === true){
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
		if (this.props.hashtag) {
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
	
	render() {
		if (!this.props.logged_in) {
			return (
				<div>投稿するにはログインしてください</div>
			)
		}
		return (
			<div>
				<div><textarea ref="textarea" /></div>
				<div><button className="button" onClick={e => this.post()}>投稿する</button></div>
			</div>
		);
	}
}