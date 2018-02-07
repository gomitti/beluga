import { Component } from "react"

export default class SettingsMenuView extends Component {
	render() {
		return (
			<div className="settings-menu-container clearfix">
				<div className="inside">
					<h2 className="title">設定</h2>
					<ul className="settings-menu">
						<li><a className="user-defined-color-hover" href="/settings/profile">プロフィール</a></li>
						<li><a className="user-defined-color-hover" href="/settings/design">デザイン</a></li>
						<li><a className="user-defined-color-hover" href="/settings/account">アカウント</a></li>
						<li><a className="user-defined-color-hover" href="/settings/bookmark">ブックマーク</a></li>
						<li><a className="user-defined-color-hover" href="/settings/security">セキュリティ</a></li>
					</ul>
					<h2 className="title">開発者</h2>
					<ul className="settings-menu">
						<li><a href="/settings/api">API</a></li>
					</ul>
				</div>
			</div>
		)
	}
}