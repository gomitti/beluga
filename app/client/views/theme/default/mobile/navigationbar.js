import { Component } from "react"
import classnames from "classnames"

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

const TabMenuItemSettings = ({ logged_in_user, active_tab }) => {
    if (!!logged_in_user === false) {
        return null
    }
    return (
        <a className={classnames("item border-bottom", { "active": active_tab === "settings" })}
            href="/settings">
            <span className="icon settings"></span>
            <span className="label">設定</span>
        </a>
    )
}

const TabMenuItemSearch = ({ active_tab }) => {
    return (
        <a className={classnames("item border-bottom", { "active": active_tab === "search" })}
            href="/settings">
            <span className="icon search"></span>
            <span className="label">検索</span>
        </a>
    )
}

const TabMenuItemProfile = ({ user, active_tab }) => {
    if (!!user === false) {
        return null
    }
    return (
        <a className={classnames("item border-bottom", { "active": active_tab === "profile" })}
            href={`/user/${user.name}`}>
            <span className="icon profile"></span>
            <span className="label">プロフィール</span>
        </a>
    )
}

const TabMenuItemMore = ({ active_tab }) => {
    return (
        <a className={classnames("item border-bottom", { "active": active_tab === "more" })} href="menu">
            <span className="icon more"></span>
            <span className="label">その他</span>
        </a>
    )
}

const TabMenuComponent = ({ logged_in_user, active_tab }) => {
    if (logged_in_user) {
        return (
            <div className="tab-menu">
                <TabMenuItemNotifications active_tab={active_tab} />
                <TabMenuItemDirectMessage user={logged_in_user} active_tab={active_tab} />
                <TabMenuItemSearch active_tab={active_tab} />
                <TabMenuItemSettings logged_in_user={logged_in_user} active_tab={active_tab} />
                <TabMenuItemProfile user={logged_in_user} active_tab={active_tab} />
                <TabMenuItemMore active_tab={active_tab} />
            </div>
        )
    }
    return (
        <div className="tab-menu">
            <a className="item logo" href="/"></a>
            <TabMenuItemExplore />
        </div>
    )
}

export default ({ logged_in_user, active_tab }) => {
    return (
        <div className={classnames("navigationbar-component", {
            "logged-in": !!logged_in_user
        })}>
            <TabMenuComponent logged_in_user={logged_in_user} active_tab={active_tab} />
        </div>
    )
}
