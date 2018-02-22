import { Component } from "react"
import classnames from "classnames"

export default class SettingsMenuView extends Component {
	render() {
		const { active } = this.props
		return (
			<div className="settings-menu-container clearfix">
				<div className="inside">
					<h2 className="title settings">設定</h2>
					<ul className="settings-menu">
						<li><a className={classnames("user-defined-color-hover user-defined-color-active item", { "active": active === "profile" })} href="/settings/profile">プロフィール</a></li>
						<li><a className={classnames("user-defined-color-hover user-defined-color-active item", { "active": active === "design" })} href="/settings/design">デザイン</a></li>
						<li><a className={classnames("user-defined-color-hover user-defined-color-active item", { "active": active === "account" })} href="/settings/account">アカウント</a></li>
						<li><a className={classnames("user-defined-color-hover user-defined-color-active item", { "active": active === "favorites" })} href="/settings/favorites">お気に入り</a></li>
						<li><a className={classnames("user-defined-color-hover user-defined-color-active item", { "active": active === "security" })} href="/settings/security">セキュリティ</a></li>
						<li><a className={classnames("user-defined-color-hover user-defined-color-active item", { "active": active === "two_factor_authentication" })} href="/settings/two_factor_authentication">2段階認証</a></li>
						<li><a className={classnames("user-defined-color-hover user-defined-color-active item", { "active": active === "desktop" })} href="/settings/desktop">デスクトップ</a></li>
					</ul>
					<h2 className="title developers">開発者</h2>
					<ul className="settings-menu">
						<li><a href="/settings/api">API</a></li>
					</ul>
				</div>
			</div>
		)
	}
}