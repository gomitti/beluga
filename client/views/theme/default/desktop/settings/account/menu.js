import { Component } from "react"
import classnames from "classnames"

export default class SettingsMenuView extends Component {
    render() {
        const { active } = this.props
        return (
            <div className="settings-menu-module clearfix">
                <div className="settings-menu-container clearfix">
                    <div className="inside">
                        <h2 className="title settings">設定</h2>
                        <ul className="settings-menu">
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "profile" })} href="/settings/profile">プロフィール</a></li>
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "design" })} href="/settings/design">デザイン</a></li>
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "account" })} href="/settings/account">アカウント</a></li>
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "pins" })} href="/settings/pins">固定</a></li>
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "uploads" })} href="/settings/uploads">アップロード</a></li>
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "security" })} href="/settings/security">セキュリティ</a></li>
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "authenticator" })} href="/settings/authenticator">スマホ認証</a></li>
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "desktop" })} href="/settings/desktop">デスクトップ</a></li>
                        </ul>
                    </div>
                </div>
                <div className="settings-menu-container clearfix">
                    <div className="inside">
                        <h2 className="title developers">開発者</h2>
                        <ul className="settings-menu">
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "access_token" })} href="/settings/access_token">APIキー</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
}