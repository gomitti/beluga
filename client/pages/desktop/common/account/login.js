import { Component } from "react"
import Head from "../../../../views/desktop/common/head"
import { request } from "../../../../api"

export default class App extends Component {

	static async getInitialProps({ query }) {
		return { ...query }
	}

	constructor(props) {
		super(props)
		if (request) {
			request.csrf_token = this.props.csrf_token
		}
	}

	signin(e) {
		e.preventDefault()
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
			.post("/account/signin", {
				name, 
				"raw_password": password,
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
			<form onSubmit={e => this.signin(e)} method="POST">
				<Head title="ログイン"></Head>
				<div>
					<p>ユーザー名</p>
					<p>@<input type="text" ref="name" /></p>
				</div>
				<div>
					<p>パスワード</p>
					<p><input type="password" ref="password" /></p>
				</div>
				<div><button className="button" onClick={e => this.signin(e)}>ログイン</button></div>
			</form>
		);
	}
}