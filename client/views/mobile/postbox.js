import React, { Component } from "react";
import { request } from "../../api"

export default class PostboxView extends Component {
	post(){
		const textarea = this.refs.textarea
		const text = textarea.value
		if(text.length == 0){
			alert("本文を入力してください")
			return
		}
		const user_name = this.refs.userName.value
		request
			.post("/status/update", { 
				text, user_name
			})
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
			})
	}

	render() {
		const store = this.props.statuses;
		return (
			<div>
				<div>名前:<input type="text" ref="userName" defaultValue="名無しさん" /></div>
				<div><textarea ref="textarea" /></div>
				<div><button className="button" onClick={e => this.post()}>投稿する</button></div>
			</div>
		);
	}
}