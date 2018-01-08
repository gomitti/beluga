import { Component } from "react"
import Head from "../../../views/desktop/head"
import { request } from "../../../api"

export default class App extends Component {

	static async getInitialProps({ query }) {
		return { ...query }
	}

	signup() {
		if(this.pending === true){
			return
		}
		this.pending = true
		const name = this.refs.name.value
		const password = this.refs.password.value
		const password_confirm = this.refs.confirmPassword.value
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
		if (password !== password_confirm) {
			alert("パスワードを正しく再入力してください")
			this.pending = false
			return
		}
		request
			.post("/account/signup", {
				name, 
				"raw_password": password,
				"csrf_token": this.props.csrf_token
			})
			.then(res => {
				const data = res.data
				if (data.success == false) {
					alert(data.error)
					this.pending = false
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
				<Head title="新規登録"></Head>
				<div>
					<p>ユーザー名</p>
					<p>@<input type="text" ref="name" /></p>
					<p>半角英数字と_のみ使用できます</p>
				</div>
				<div>
					<p>パスワード</p>
					<p><input type="password" ref="password" /></p>
					<p>72文字までの半角英数字と記号のみ使用できます</p>
				</div>
				<div>
					<p>パスワードを再入力</p>
					<p><input type="password" ref="confirmPassword" /></p>
				</div>
				<div><button className="button" onClick={e => this.signup()}>登録</button></div>
			</div>
		);
	}
}