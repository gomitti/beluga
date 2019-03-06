import { Component } from "react"
import classnames from "classnames"
import ws from "../../../../websocket"

const TabMenuItemNotifications = ({ active_tab }) => {
    return (
        <a className={classnames("item border-bottom", { "active": active_tab === "notifications" })}
            href="/notifications">
            <span className="icon notifications"></span>
            <span className="label">通知</span>
        </a>
    )
}

const TabMenuItemDirectMessage = ({ user, active_tab }) => {
    if (!!user === false) {
        return null
    }
    return (
        <a className={classnames("item border-bottom", { "active": active_tab === "direct_message" })}
            href={`/@${user.name}`}>
            <span className="icon message"></span>
            <span className="label">メッセージ</span>
        </a>
    )
}

const TabMenuItemExplore = ({ active_tab }) => {
    return (
        <a className={classnames("item border-bottom", { "active": active_tab === "explore" })}
            href="/explore">
            <span className="icon explore"></span>
            <span className="label">探す</span>
        </a>
    )
}

const NavigationbarDropdownFindComponent = () => {
    return (
        <div className="navigationbar-dropdown-component find">
            <div className="inside">
                <ul className="menu">
                    <a className="item" href="/search">投稿を検索する</a>
                    <a className="item" href="/explore">コミュニティを探す</a>
                </ul>
            </div>
        </div>
    )
}

const NavigationbarDropdownSettingsComponent = () => {
    return (
        <div className="navigationbar-dropdown-component settings">
            <div className="inside">
                <ul className="menu">
                    <a className="item" href="/settings/profile">プロフィール</a>
                    <a className="item" href="/settings/design">デザイン</a>
                    <a className="item" href="/settings/pins">固定</a>
                    <a className="item" href="/settings/uploads">アップロード</a>
                    <a className="item" href="/settings/mute">ミュート</a>
                    <a className="item" href="/settings/desktop">デスクトップ</a>
                </ul>
            </div>
        </div>
    )
}

const RightAreaComponent = ({ logged_in_user }) => {
    if (!!logged_in_user === false) {
        return null
    }
    return (
        <div className="right-area">
            <div className="menu">
                <div className="item navigationbar-dropdown-menu">
                    <span className="icon find"></span>
                    <NavigationbarDropdownFindComponent />
                </div>
                <div className="item navigationbar-dropdown-menu">
                    <span className="icon settings"></span>
                    <NavigationbarDropdownSettingsComponent />
                </div>
                <div className="item user navigationbar-dropdown-menu">
                    <a className="link" href={`/user/${logged_in_user.name}`}>
                        <img className="avatar" src={logged_in_user.avatar_url} />
                    </a>
                    <div className="navigationbar-dropdown-component user">
                        <div className="inside">
                            <ul className="menu">
                                <a className="item" href="/support">ヘルプ</a>
                                <a className="item" href="/logout">ログアウト</a>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const LefttAreaComponent = ({ logged_in_user, active_tab }) => {
    if (logged_in_user) {
        return (
            <div className="left-area">
                <div className="tab-menu">
                    <a className="item logo" href="/"></a>
                    <TabMenuItemNotifications active_tab={active_tab} />
                    <TabMenuItemDirectMessage user={logged_in_user}  active_tab={active_tab} />
                </div>
            </div>
        )
    }
    return (
        <div className="left-area">
            <div className="tab-menu">
                <a className="item logo" href="/"></a>
                <TabMenuItemExplore />
            </div>
        </div>
    )
}

export default ({ logged_in_user, active_tab }) => {
    return (
        <div className={classnames("navigationbar-component", {
            "logged-in": !!logged_in_user
        })}>
            <LefttAreaComponent logged_in_user={logged_in_user} active_tab={active_tab} />
            <RightAreaComponent logged_in_user={logged_in_user} />
        </div>
    )
}