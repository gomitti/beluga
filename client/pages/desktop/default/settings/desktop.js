import { Component } from "react"
import classnames from "classnames"
import { SliderPicker, CirclePicker } from 'react-color';
import Head from "../../../../views/desktop/default/head"
import NavigationBarView from "../../../../views/desktop/default/navigationbar"
import SettingsMenuView from "../../../../views/desktop/default/settings/menu"
import config from "../../../../beluga.config"
import { request } from "../../../../api"

export default class App extends Component {
	static async getInitialProps({ query }) {
		return { ...query }
	}
	constructor(props) {
		super(props)
		const { logged_in } = props
		this.state = {
			"color": logged_in ? logged_in.profile.theme_color : config.default_theme_color,
		}
		if (request) {
			request.csrf_token = this.props.csrf_token
		}
	}
	onUpdateThemeColor = color => {
		this.setState({ color })
	}
	render() {
		const { platform, logged_in } = this.props
		logged_in.profile.theme_color = this.state.color
		return (
			<div id="app" className="settings">
				<Head title={`デザイン / 設定 / ${config.site.name}`} platform={platform} logged_in={logged_in} />
				<NavigationBarView logged_in={logged_in} />
				<SettingsMenuView active="desktop" />
				<div className="settings-content scroller-wrapper">
					<div className="scroller">
						<div className="inside">
							<div className="settings-module form desktop">
								<div className="head">
									<h1>デスクトップ</h1>
								</div>
								<div className="item">
									<h3 className="title">ルームの開き方</h3>
									<p><label><input type="radio" name="open_room_in" value="self" />現在のタイムラインで開く</label></p>
									<p><label><input type="radio" name="open_room_in" value="new" />一度だけ新しいタイムラインを開き、以降はそのタイムラインで開く</label></p>
									<p><label><input type="radio" name="open_room_in" value="blank" />常に新しいタイムラインで開く</label></p>
								</div>
								<div className="submit">
									<button
										className={classnames("button user-defined-bg-color", { "in-progress": this.state.pending_change })}
										onClick={this.onUpdate}>
										<span className="progress-text">保存しています</span>
										<span className="display-text">設定を保存</span>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}