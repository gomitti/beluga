import { Component } from "react"
import classnames from "classnames"
import ServerDetailView from "../../column/server"

export default class SettingsMenuView extends Component {
    render() {
        const { active, server, channel } = this.props
        return (
            <div className="settings-menu-module clearfix">
                <h1 className="name">
                    <a href={`/server/${server.name}/${channel.name}`}>#{channel.name}</a>
                </h1>
                <div className="settings-menu-container clearfix">
                    <div className="inside">
                        <h2 className="title settings">チャンネル設定</h2>
                        <ul className="settings-menu">
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "profile" })} href={`/server/${server.name}/${channel.name}/settings/profile`}>情報</a></li>
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "access_control" })} href={`/server/${server.name}/${channel.name}/settings/access_control`}>アクセスコントロール</a></li>
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "block" })} href={`/server/${server.name}/${channel.name}/settings/block`}>ブロック</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
}