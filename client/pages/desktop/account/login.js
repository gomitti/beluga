import { Component } from "react";
import Head from "../../../views/desktop/head"
import { request } from "../../../api"

export default class App extends Component {

	static async getInitialProps({ query }) {
		return { "csrf_token": query.csrf_token }
	}

	signin() {
		if (this.pending === true) {
			return
		}
		this.pending = true
		const name = this.refs.name.value
		const password = this.refs.password.value
		if (name.length == 0) {
			alert("ユーザー名を入力してください")
			this.pending = false
			return
		}
		if (password.length == 0) {
			alert("パスワードを入力してください")
			this.pending = false
			return
		}
		request
			.post("/user/signin", {
				name, 
				"raw_password": password,
				"csrf_token": this.props.csrf_token
			})
			.then(res => {
				const data = res.data
				if (data.success == false) {
					alert(data.error)
					return
				}
				location.href = "/"
			})
			.catch(error => {
				alert(error)
				this.pending = false
			})
	}
	render() {
		return (
			<div>
				<Head title="ログイン"></Head>
				<div>
					<p>ユーザー名</p>
					<p>@<input type="text" ref="name" /></p>
				</div>
				<div>
					<p>パスワード</p>
					<p><input type="password" ref="password" /></p>
				</div>
				<div><button className="button" onClick={e => this.signin()}>ログイン</button></div>
			</div>
		);
	}
}