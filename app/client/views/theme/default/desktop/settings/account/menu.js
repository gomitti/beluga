import React from "react"
import classnames from "classnames"

export const AccountSettingsMenuComponent = ({ active_page }) => {
    return (
        <div className="settings-menu-component">
            <div className="inside">
                <h2 className="title settings">設定</h2>
                <ul className="menu">
                    <a className="item" href="/settings/profile">
                        <span className={classnames("user-defined-color-hover user-defined-color-active label user-defined-border-color-active", { "active": active_page === "profile" })}>プロフィール</span>
                    </a>
                    <a className="item" href="/settings/design">
                        <span className={classnames("user-defined-color-hover user-defined-color-active label user-defined-border-color-active", { "active": active_page === "design" })}>デザイン</span>
                    </a>
                    <a className="item" href="/settings/account">
                        <span className={classnames("user-defined-color-hover user-defined-color-active label user-defined-border-color-active", { "active": active_page === "account" })}>アカウント</span>
                    </a>
                    <a className="item" href="/settings/pins">
                        <span className={classnames("user-defined-color-hover user-defined-color-active label user-defined-border-color-active", { "active": active_page === "pins" })}>固定</span>
                    </a>
                    <a className="item" href="/settings/uploads">
                        <span className={classnames("user-defined-color-hover user-defined-color-active label user-defined-border-color-active", { "active": active_page === "uploads" })}>アップロード</span>
                    </a>
                    <a className="item" href="/settings/mute">
                        <span className={classnames("user-defined-color-hover user-defined-color-active label user-defined-border-color-active", { "active": active_page === "mute" })}>ミュート</span>
                    </a>
                    <a className="item" href="/settings/desktop">
                        <span className={classnames("user-defined-color-hover user-defined-color-active label user-defined-border-color-active", { "active": active_page === "desktop" })}>デスクトップ</span>
                    </a>
                </ul>
            </div>
        </div>
    )
}

export const DevelopperSettingsMenuComponent = ({ active_page }) => {
    return (
        <div className="settings-menu-component">
            <div className="inside">
                <h2 className="title developers">開発者</h2>
                <ul className="menu">
                    <a className="item" href="/settings/access_token">
                        <span className={classnames("user-defined-color-hover user-defined-color-active label user-defined-border-color-active", { "active": active_page === "access_token" })}>アクセストークン</span>
                    </a>
                </ul>
            </div>
        </div>
    )
}

export default ({ active_page }) => {
    return (
        <React.Fragment>
            <AccountSettingsMenuComponent active_page={active_page} />
            <DevelopperSettingsMenuComponent active_page={active_page} />
        </React.Fragment>
    )
}