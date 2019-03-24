import { Component } from "react"
import classnames from "classnames"
import assert, { is_object } from "../../../../../../assert";

const CommunityComponent = ({ community }) => {
    assert(is_object(community), "$community must be of type object")
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
                                <a className="item user-defined-bg-color-hover" href={`/${community.name}/customize/emoji`}>絵文字の追加</a>
                                <a className="item user-defined-bg-color-hover" href={`/${community.name}/create_new_channel`}>チャンネルの作成</a>
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
    assert(is_object(community), "$community must be of type object")
    return (
        <div className="tab-menu-area">
            <div className="tab-menu">
                <a className={classnames("item border-bottom user-defined-color-active user-defined-border-color-active", {
                    "active": active_tab === "about"
                })} href={`/${community.name}`}>
                    <span className="icon about"></span>
                    <span className="label">概要</span>
                </a>
                <a className={classnames("item border-bottom user-defined-color-active user-defined-border-color-active", {
                    "active": active_tab === "channels"
                })} href={`/${community.name}/channels`}>
                    <span className="icon channels"></span>
                    <span className="label">チャンネル</span>
                </a>
                <a className={classnames("item border-bottom user-defined-color-active user-defined-border-color-active", {
                    "active": active_tab === "members"
                })} href={`/${community.name}/members`}>
                    <span className="icon members"></span>
                    <span className="label">ユーザー</span>
                </a>
                <a className="item border-bottom user-defined-color-active user-defined-border-color-active" href={`/${community.name}/statuses`}>
                    <span className="icon timeline"></span>
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