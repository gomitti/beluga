import { Component } from "react"
import { split_emoji_unicode, parse_emoji_unicode } from "./parser"
import classnames from "classnames"
import ws from "../../../../websocket"
import * as notification from "../../../../notification"
import { request } from "../../../../api"
import MentionsPageView from "./navigationbar/user/page/mentions"

class NavigationBarUserView extends Component {
    constructor(props) {
        super(props)
        const { logged_in } = this.props
        this.displayNameView = null
        if (logged_in.display_name.length === 0) {
            this.displayNameView = "@" + logged_in.name
        } else {
            const components = split_emoji_unicode([logged_in.display_name])
            const subviews = []
            for (const substr of components) {
                // 絵文字（ユニコード）
                if (parse_emoji_unicode(substr, subviews)) {
                    continue
                }
                // それ以外
                subviews.push(substr)
            }
            this.displayNameView = subviews
        }
        this.state = {
            "current_page": "menu",
            "active": false
        }
    }
    onClickMentions = event => {
        event.preventDefault()
        event.stopPropagation()
        this.setState({
            "current_page": "mentions"
        })
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
                            <li><a href={`/user/${logged_in.name}`} target="_blank">プロフィール</a></li>
                            <li><a className="arrow" href={`/mentions`} target="_blank" onClick={this.onClickMentions}>@関連</a></li>
                            <li><a className="arrow" href={`/user/${logged_in.name}/lists`} target="_blank">リスト</a></li>
                        </ul>
                        <ul className="block">
                            <li><a href="/settings/profile" target="_blank">設定とプライバシー</a></li>
                            <li><a href="/settings/profile" target="_blank">ヘルプセンター</a></li>
                            <li><a href="/logout" target="_blank">ログアウト</a></li>
                        </ul>
                    </div>
                    <div className="mentions">
                        <MentionsPageView current_server={server} back={this.back} logged_in={logged_in} />
                    </div>
                </div>
            </div>
        )
    }
}

export default class NavigationBarView extends Component {
    render() {
        const { server, logged_in, active, is_bottom_hidden } = this.props
        return (
            <div id="navigationbar">
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
                                            <li><a href="/settings/profile" target="_blank">プロフィール</a></li>
                                            <li><a href="/settings/design" target="_blank">デザイン</a></li>
                                            <li><a href="/settings/account" target="_blank">アカウント</a></li>
                                            <li><a href="/settings/favorites" target="_blank">お気に入り</a></li>
                                            <li><a href="/settings/uploads" target="_blank">アップロード</a></li>
                                            <li><a href="/settings/security" target="_blank">セキュリティ</a></li>
                                            <li><a href="/settings/two_factor_authentication" target="_blank">2段階認証</a></li>
                                            <li><a href="/settings/desktop" target="_blank">デスクトップ</a></li>
                                        </ul>
                                    </li>
                                    :
                                    <li>
                                        <a href="">アカウント</a>
                                        <ul className="navigationbar-pulldown-menu">
                                            <li><a href="/login" target="_blank">ログイン</a></li>
                                            <li><a href="/signup" target="_blank">新規登録</a></li>
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
                                        <li><a href="https://help.beluga.fm" target="_blank">ヘルプ</a></li>
                                        <li><a href="https://research.beluga.fm" className="verdana" target="_blank">Research</a></li>
                                        <li><a href="https://playground.beluga.fm" className="verdana" target="_blank">Playground</a></li>
                                        <li><a href="https://github.com/belugafm/beluga" target="_blank">ソースコード</a></li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                {(() => {
                    if (is_bottom_hidden !== true && logged_in) {
                        return (
                            <div className="bottom">
                                <NavigationBarUserView logged_in={logged_in} server={server} />
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
                                    {server ?
                                        <li>
                                            <a href={`/server/${server.name}/hashtags`} className={classnames("user-defined-color-hover user-defined-color-active user-defined-border-color-hover user-defined-border-color-active", {
                                                "active": active === "hashtags"
                                            })}>
                                                <span className="icon hashtags"></span>
                                                <span className="text">みつける</span>
                                            </a>
                                        </li>
                                        : null
                                    }
                                    {server ?
                                        <li>
                                            <a href={`/world/${server.name}`} className={classnames("user-defined-color-hover user-defined-color-active user-defined-border-color-hover user-defined-border-color-active", {
                                                "active": active === "world"
                                            })}>
                                                <span className="icon world"></span>
                                                <span className="text">タイムライン</span>
                                            </a>
                                        </li>
                                        : null
                                    }
                                </ul>
                            </div>
                        )
                    }
                })()}
            </div>
        )
    }
}