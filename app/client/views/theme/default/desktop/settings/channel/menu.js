import { Component } from "react"
import classnames from "classnames"

export default ({ active_page, community, channel }) => {
    return (
        <div className="settings-menu-component">
            <div className="inside">
                <h2 className="title">設定</h2>
                <ul className="menu">
                    <a className="item" href={`/${community.name}/${channel.name}/settings/profile`}>
                        <span className={classnames("user-defined-color-hover user-defined-color-active label user-defined-border-color-active", { "active": active_page === "profile" })}>情報</span>
                    </a>
                    <a className="item" href={`/${community.name}/${channel.name}/settings/access_control`}>
                        <span className={classnames("user-defined-color-hover user-defined-color-active label user-defined-border-color-active", { "active": active_page === "access_control" })}>アクセスコントロール</span>
                    </a>
                    <a className="item" href={`/${community.name}/${channel.name}/settings/kick`}>
                        <span className={classnames("user-defined-color-hover user-defined-color-active label user-defined-border-color-active", { "active": active_page === "kick" })}>キック</span>
                    </a>
                </ul>
            </div>
        </div>
    )
}