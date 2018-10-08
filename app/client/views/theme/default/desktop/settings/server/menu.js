import { Component } from "react"
import classnames from "classnames"
import ServerDetailView from "../../column/server"

export default class SettingsMenuView extends Component {
    render() {
        const { active, server } = this.props
        return (
            <div className="settings-menu-module clearfix">
                <ServerDetailView server={server} is_members_hidden={true} ellipsis_description={true} collapse_members={true} />
                <div className="settings-menu-container clearfix">
                    <div className="inside">
                        <h2 className="title settings">設定</h2>
                        <ul className="settings-menu">
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "profile" })} href={`/server/${server.name}/settings/profile`}>プロフィール</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
}