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

class DropdownMenuButton extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_active": false
        }
    }
    onTouchStart = event => {
        this.touched = true
    }
    onTouchCancel = event => {
        this.touched = false
    }
    onTouchMove = event => {
        this.touched = false
    }
    onTouchEnd = event => {
        if (this.touched !== true) {
            return
        }
        const { onClick } = this.props
        if (onClick) {
            onClick(event, this.state.is_active)
        }
    }
    render() {
        const { children } = this.props
        return (
            <div className={classnames("item border-bottom", { "active": this.state.is_active })}
                onTouchStart={this.onTouchStart}
                onTouchMove={this.onTouchMove}
                onTouchCancel={this.onTouchCancel}
                onTouchEnd={this.onTouchEnd} >
                {children}
            </div>
        )
    }
}

class TabMenuItemSettings extends DropdownMenuButton {
    render() {
        const { logged_in_user, active_tab, handle_click } = this.props
        if (!!logged_in_user === false) {
            return null
        }
        return (
            <DropdownMenuButton onClick={handle_click}>
                <span className="icon settings"></span>
                <span className="label">設定</span>
            </DropdownMenuButton>
        )
    }
}

const DropdownMenuSettings = ({ is_active }) => {
    if (is_active === false) {
        return null
    }
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

const TabMenuItemChannels = ({ active_tab }) => {
    return (
        <a className={classnames("item border-bottom", { "active": active_tab === "channels" })}
            href="/beluga/channels">
            <span className="icon channels"></span>
            <span className="label">チャンネル</span>
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


class TabMenuItemMore extends DropdownMenuButton {
    render() {
        const { active_tab, handle_click } = this.props
        return (
            <DropdownMenuButton onClick={handle_click}>
                <span className="icon more"></span>
                <span className="label">その他</span>
            </DropdownMenuButton>
        )
    }
}

const DropdownMenuMore = ({ is_active }) => {
    if (is_active === false) {
        return null
    }
    return (
        <div className="navigationbar-dropdown-component more">
            <div className="inside">
                <ul className="menu">
                    <a className="item" href="/support">ヘルプ</a>
                    <a className="item" href="/logout">ログアウト</a>
                </ul>
            </div>
        </div>
    )
}

const TabMenuComponent = ({ logged_in_user, active_tab, handle_click_settings, handle_click_more }) => {
    if (logged_in_user) {
        return (
            <div className="tab-menu">
                <TabMenuItemNotifications active_tab={active_tab} />
                <TabMenuItemDirectMessage user={logged_in_user} active_tab={active_tab} />
                <TabMenuItemChannels active_tab={active_tab} />
                <TabMenuItemSettings logged_in_user={logged_in_user} active_tab={active_tab} handle_click={handle_click_settings} />
                <TabMenuItemProfile user={logged_in_user} active_tab={active_tab} />
                <TabMenuItemMore active_tab={active_tab} handle_click={handle_click_more} />
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

export default class NavigationbarComponent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_settings_active": false,
            "is_more_active": false
        }
    }
    onClickSettings = () => {
        this.setState({
            "is_settings_active": !this.state.is_settings_active,
            "is_more_active": false
        })
    }
    onClickMore = () => {
        this.setState({
            "is_more_active": !this.state.is_more_active,
            "is_settings_active": false,
        })
    }
    render() {
        const { logged_in_user, active_tab } = this.props
        return (
            <div className={classnames("navigationbar-component", {
                "logged-in": !!logged_in_user
            })}>
                <TabMenuComponent
                    logged_in_user={logged_in_user}
                    active_tab={active_tab}
                    handle_click_settings={this.onClickSettings}
                    handle_click_more={this.onClickMore} />
                <DropdownMenuSettings is_active={this.state.is_settings_active} />
                <DropdownMenuMore is_active={this.state.is_more_active} />
            </div>
        )
    }
}

