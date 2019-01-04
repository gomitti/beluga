import { Component } from "react"
import { observer } from "mobx-react"
import { split_emoji_unicode, parse_emoji_unicode } from "./parser"
import classnames from "classnames"
import ws from "../../../../websocket"
import * as notification from "../../../../notification"
import { request } from "../../../../api"
import MentionsPageView from "./navigationbar/user/page/mentions"
import Snackbar from "./snackbar"

class NavigationbarUserView extends Component {
    constructor(props) {
        super(props)
        const { logged_in } = this.props
        this.displayNameView = null
        if (logged_in.display_name.length === 0) {
            this.displayNameView = "@" + logged_in.name
        } else {
            const components = split_emoji_unicode([logged_in.display_name])
            const subviews = []
            components.forEach(substr => {
                // 絵文字（ユニコード）
                if (parse_emoji_unicode(substr, subviews)) {
                    return
                }
                // それ以外
                subviews.push(substr)
            })
            this.displayNameView = subviews
        }
        this.state = {
            "current_page": "menu",
            "active": false
        }
    }
    toggle = event => {
        event.preventDefault()
        event.stopPropagation()
        this.setState({
            "current_page": "menu",
            "active": !this.state.active
        })
    }
    back = event => {
        event.preventDefault()
        event.stopPropagation()
        this.setState({
            "current_page": "menu"
        })
    }
    render() {
        const { logged_in, server } = this.props
        return (
            <div className={classnames("navigationbar-user", {
                "active": this.state.active
            })}>
                <div className="user-display" onClick={this.toggle}>
                    <div className="avatar">
                        <img src={logged_in.avatar_url} className="image" />
                    </div>
                    <div className="meta">
                        <p className="display-name">{this.displayNameView}</p>
                    </div>
                </div>
                <div className={`content page-${this.state.current_page}`}>
                    <div className="menu">
                        <ul className="block">
                            <li><a href={`/user/${logged_in.name}`}>プロフィール</a></li>
                            <li><a href="/mentions">@関連</a></li>
                        </ul>
                        <ul className="block">
                            <li><a href="/settings/profile">設定とプライバシー</a></li>
                            <li><a href="/settings/profile">ヘルプセンター</a></li>
                            <li><a href="/logout">ログアウト</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
}

export default class NavigationbarView extends Component {
    render() {
        const { server, logged_in, active, is_bottom_hidden } = this.props
        return (
            <div id="navigationbar" className={classnames({
                "logged-in": !!logged_in
            })}>
                <div className="top">
                    <div className="inside clearfix">
                        <div className="navigationbar-logo-container">
                            <a href="/" className="logo"></a>
                        </div>
                        <div className="navigationbar-pulldown-container clearfix meiryo">
                            <ul>
                                {logged_in ?
                                    <li>
                                        <a href="">設定</a>
                                        <ul className="navigationbar-pulldown-menu">
                                            <li><a href="/settings/profile">プロフィール</a></li>
                                            <li><a href="/settings/design">デザイン</a></li>
                                            <li><a href="/settings/account">アカウント</a></li>
                                            <li><a href="/settings/pins">固定</a></li>
                                            <li><a href="/settings/uploads">アップロード</a></li>
                                            <li><a href="/settings/mute">ミュート</a></li>
                                            <li><a href="/settings/desktop">デスクトップ</a></li>
                                        </ul>
                                    </li>
                                    :
                                    <li>
                                        <a href="">アカウント</a>
                                        <ul className="navigationbar-pulldown-menu">
                                            <li><a href="/login">ログイン</a></li>
                                            <li><a href="/signup">新規登録</a></li>
                                        </ul>
                                    </li>
                                }
                                <li>
                                    <a href="">探す</a>
                                    <ul className="navigationbar-pulldown-menu">
                                        <li><a href="">投稿を検索</a></li>
                                        <li><a href="">サーバーを探す</a></li>
                                    </ul>
                                </li>
                                <li>
                                    <a href="" className="misc"></a>
                                    <ul className="navigationbar-pulldown-menu">
                                        {/* <li><a href="https://help.beluga.fm">ヘルプ</a></li>
                                        <li><a href="https://research.beluga.fm" className="verdana">Research</a></li>
                                        <li><a href="https://playground.beluga.fm" className="verdana">Playground</a></li> */}
                                        <li><a href="https://github.com/belugafm/beluga">ソースコード</a></li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                {(is_bottom_hidden !== true && logged_in) ?
                    <div className="bottom">
                        <NavigationbarUserView logged_in={logged_in} server={server} />
                        <ul className="navigationbar-menu">
                            {server && logged_in ?
                                <li>
                                    <a href={`/server/${server.name}/@${logged_in.name}`} className={classnames("user-defined-color-hover user-defined-color-active user-defined-border-color-hover user-defined-border-color-active", {
                                        "active": active === "home"
                                    })}>
                                        <span className="icon home"></span>
                                        <span className="text">ホーム</span>
                                    </a>
                                </li>
                                : null
                            }
                            {server && logged_in ?
                                <li>
                                    <a href={`/server/${server.name}/notifications`} className={classnames("user-defined-color-hover user-defined-color-active user-defined-border-color-hover user-defined-border-color-active", {
                                        "active": active === "notifications"
                                    })}>
                                        <span className="icon notifications"></span>
                                        <span className="text">通知</span>
                                    </a>
                                </li>
                                : null
                            }
                            {server ?
                                <li>
                                    <a href={`/server/${server.name}/channels`} className={classnames("user-defined-color-hover user-defined-color-active user-defined-border-color-hover user-defined-border-color-active", {
                                        "active": active === "channels"
                                    })}>
                                        <span className="icon channels"></span>
                                        <span className="text">みつける</span>
                                    </a>
                                </li>
                                : null
                            }
                            {server ?
                                <li>
                                    <a href={`/server/${server.name}/statuses`} className={classnames("user-defined-color-hover user-defined-color-active user-defined-border-color-hover user-defined-border-color-active", {
                                        "active": active === "statuses"
                                    })}>
                                        <span className="icon world"></span>
                                        <span className="text">タイムライン</span>
                                    </a>
                                </li>
                                : null
                            }
                        </ul>
                    </div>
                    : null}
                <Snackbar />
            </div>
        )
    }
}