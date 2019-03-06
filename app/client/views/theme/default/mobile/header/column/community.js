import { Component } from "react"
import classnames from "classnames"

const CommunityComponent = ({ community }) => {
    return (
        <div className="community-area">
            <div className="detail">
                <img src={community.avatar_url} className="avatar" />
                <span className="name">{community.display_name}</span>
            </div>
            <div className="menu-area">
                <div className="dropdown-menu">
                    <span className="icon"></span>
                    <div className="dropdown-component">
                        <div className="inside">
                            <ul className="menu">
                                <a className="item user-defined-bg-color-hover" href={`/${community.name}/settings/profile`}>コミュニティ設定</a>
                                <span className="divider"></span>
                                <a className="item user-defined-bg-color-hover">{`${community.display_name} から退出する`}</a>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const TabMenuComponent = ({ community, active_tab }) => {
    return (
        <div className="tab-menu-area">
            <div className="tab-menu">
                <a className={classnames("item border-bottom user-defined-color-active user-defined-border-color-active", {
                    "active": active_tab === "about"
                })} href={`/${community.name}`}>
                    <span className="label">概要</span>
                </a>
                <a className={classnames("item border-bottom user-defined-color-active user-defined-border-color-active", {
                    "active": active_tab === "channels"
                })} href={`/${community.name}/channels`}>
                    <span className="label">チャンネル</span>
                </a>
                <a className={classnames("item border-bottom user-defined-color-active user-defined-border-color-active", {
                    "active": active_tab === "members"
                })} href={`/${community.name}/members`}>
                    <span className="label">メンバー</span>
                </a>
                <a className="item border-bottom user-defined-color-active user-defined-border-color-active" href={`/${community.name}/statuses`}>
                    <span className="label">タイムライン</span>
                </a>
            </div>
        </div>
    )
}

export default ({ community, active_tab }) => {
    return (
        <div className="community-header-component">
            <CommunityComponent community={community} />
            <TabMenuComponent community={community} active_tab={active_tab} />
        </div>
    )
}