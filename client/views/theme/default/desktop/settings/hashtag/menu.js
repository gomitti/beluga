import { Component } from "react"
import classnames from "classnames"
import CardView from "../../card/server"

export default class SettingsMenuView extends Component {
    render() {
        const { active, server, hashtag } = this.props
        return (
            <div className="settings-menu-module clearfix">
                <CardView server={server} is_description_hidden={true} is_members_hidden={true} />
                <h1 className="tagname">
                    <a href={`/server/${server.name}/${hashtag.tagname}`}>#{hashtag.tagname}</a>
                </h1>
                <div className="settings-menu-container clearfix">
                    <div className="inside">
                        <h2 className="title settings">設定</h2>
                        <ul className="settings-menu">
                            <li><a className={classnames("user-defined-color-hover user-defined-color-active item user-defined-border-color-active", { "active": active === "profile" })} href={`/hashtag/${server.name}/${hashtag.tagname}/edit`}>ルーム情報</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
}