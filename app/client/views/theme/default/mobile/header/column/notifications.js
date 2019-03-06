import { Component } from "react"
import classnames from "classnames"

const TabMenuComponent = ({ user, active_tab }) => {
    return (
        <div className="tab-menu-area">
            <div className="tab-menu">
                <a className={classnames("item border-bottom user-defined-color-active user-defined-border-color-active", {
                    "active": active_tab === "all"
                })} href="/notifications">
                    <span className="icon about"></span>
                    <span className="label">すべて</span>
                </a>
                <a className={classnames("item border-bottom user-defined-color-active user-defined-border-color-active", {
                    "active": active_tab === "mentions"
                })} href="/notifications/mentions">
                    <span className="icon channels"></span>
                    <span className="label">リプライ</span>
                </a>
                <a className={classnames("item border-bottom user-defined-color-active user-defined-border-color-active", {
                    "active": active_tab === "threads"
                })} href="/notifications/threads">
                    <span className="icon members"></span>
                    <span className="label">スレッド</span>
                </a>
            </div>
        </div>
    )
}

export default ({ user, active_tab }) => {
    return (
        <div className="notifications-header-component">
            <TabMenuComponent user={user} active_tab={active_tab} />
        </div>
    )
}