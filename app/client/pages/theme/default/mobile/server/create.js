import Head from "../../../../../views/desktop/common/head"
import { request } from "../../../../../api"
import config from "../../../../../beluga.config"
import Component from "../../../../../views/app"

export default class App extends Component {
	create = event => {
		if (this.pending === true) {
			return
		}
		this.pending = true
		const name = this.refs.name.value
		const display_name = this.refs.displayName.value
		if (name.length == 0) {
			alert("サーバー名を入力してください")
			this.pending = false
			return
		}
		if (display_name.length == 0) {
			alert("表示名を入力してください")
			this.pending = false
			return
		}
		request
			.post("/server/create", {
				name,
				display_name,
			})
			.then(res => {
				const data = res.data
				if (data.success == false) {
					alert(data.error)
					this.pending = false
					return
				}
				location.href = `/server/${data.server.name}/general`
			})
			.catch(error => {
				alert(error)
				this.pending = false
			})
	}
	render() {
		return (
			<div>
				<Head title="サーバーの作成"></Head>
				<div>
					<p>サーバー名</p>
					<p>{config.domain}/server/<input type="text" ref="name" /></p>
					<p>半角英数字と_のみ使用できます</p>
				</div>
				<div>
					<p>表示名</p>
					<p><input type="text" ref="displayName" /></p>
				</div>
				<div><button className="button" onClick={this.create}>作成</button></div>
			</div>
		)
	}
}