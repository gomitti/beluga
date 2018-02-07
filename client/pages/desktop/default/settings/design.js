import { Component } from "react"
import { useStrict } from "mobx"
import { SliderPicker, CirclePicker } from 'react-color';
import Head from "../../../../views/desktop/default/head"
import NavigationBarView from "../../../../views/desktop/default/navigationbar"
import SettingsMenuView from "../../../../views/desktop/default/settings/menu"
import config from "../../../../beluga.config"
import { request } from "../../../../api"

// mobxの状態をaction内でのみ変更可能にする
useStrict(true)

export default class App extends Component {
	static async getInitialProps({ query }) {
		return { ...query }
	}
	constructor(props) {
		super(props)
		const { logged_in } = props
		this.state = {
			"color": logged_in ? logged_in.profile.theme_color : config.default_theme_color
		}
		if (request) {
			request.csrf_token = this.props.csrf_token
		}
	}
	onColorChangeComplete = (color, event) => {
		this.setState({
			"color": color.hex
		})
	}
	onInputChange = (event) => {
		const { hex } = this.refs
		this.setState({
			"color": hex.value
		})
	}
	onUpdateProfile = event => {
		if (this.pending === true) {
			return
		}
		this.pending = true
		request
			.post("/account/profile/update", {
				"theme_color": this.state.color
			})
			.then(res => {
				const data = res.data
				if (data.success == false) {
					alert(data.error)
				} else {
					alert("保存しました")
				}
			})
			.catch(error => {
				alert(error)
			})
			.then(_ => {
				this.pending = false
			})
	}
	onResetProfile = event => {
		if (this.pending === true) {
			return
		}
		this.pending = true
		request
			.post("/account/profile/update", {
				"theme_color": config.default_theme_color
			})
			.then(res => {
				const data = res.data
				if (data.success == false) {
					alert(data.error)
				} else {
					alert("保存しました")
					this.setState({
						"color": config.default_theme_color
					})
				}
			})
			.catch(error => {
				alert(error)
			})
			.then(_ => {
				this.pending = false
			})
	}
	render() {
		const { platform, logged_in } = this.props
		logged_in.profile.theme_color = this.state.color
		return (
			<div id="app" className="settings">
				<Head title={`デザイン / 設定 / ${config.site.name}`} platform={platform} logged_in={logged_in} />
				<NavigationBarView logged_in={logged_in} />
				<SettingsMenuView />
				<div className="settings-content scroller-wrapper">
					<div className="scroller">
						<div className="inside">
							<div className="settings-module color-pickers">
								<div className="head">
									<h1>テーマカラー</h1>
								</div>
								<div className="picker">
									<CirclePicker width="380px" colors={[
										"#f78da7", "#f47373", "#f44336", "#e91e63", "#ba68c8", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3",
										"#0693e3", "#03a9f4", "#00bcd4", "#8ed1fc", "#009688", "#4caf50", "#8bc34a",
										"#cddc39", "#00d084", "#7bdcb5", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#ff8a65", "#795548",
										"#607d8b", "#abb8c3"
									]} color={this.state.color} onChangeComplete={this.onColorChangeComplete} />
								</div>
								<div className="picker slider">
									<SliderPicker color={this.state.color} onChangeComplete={this.onColorChangeComplete} />
								</div>
								<div className="picker input">
									<input className="input" value={this.state.color} style={{
										"borderBottomColor": this.state.color
									}} onChange={this.onInputChange} ref="hex" />
								</div>
								<div className="submit">
									<button className="button user-defined-bg-color" onClick={this.onUpdateProfile}>テーマカラーを保存</button>
									<button className="button neutral user-defined-bg-color" onClick={this.onResetProfile}>デフォルトに戻す</button>
								</div>
							</div>

							<div className="settings-module color-pickers">
								<div className="head">
									<h1>背景画像</h1>
								</div>
								<div className="submit">
									<button className="button user-defined-bg-color">背景画像を保存</button>
									<button className="button neutral user-defined-bg-color">デフォルトに戻す</button>
								</div>
							</div>

						</div>
					</div>
				</div>
			</div>
		)
	}
}