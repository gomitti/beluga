import { Component } from "react"
import classnames from "classnames"
import ws from "../../../../../../websocket"
import * as notification from "../../../../../../notification"
import assert from "../../../../../../assert"
import { ColumnStore } from "../../../../../../stores/theme/default/desktop/column"

class NotificationMenuItem extends Component {
    constructor(props) {
        super(props)
        const { column } = this.props
        assert(column instanceof ColumnStore, "$column must be an instance of ColumnStore")
        this.state = {
            "notification_enabled": column.settings.desktop_notification_enabled
        }
    }
    componentDidMount = () => {
        const original_title = (typeof document === "undefined") ? "" : document.title
        if (typeof document !== "undefined") {
            ws.addEventListener("message", event => {
                if (document.hasFocus()) {
                    return
                }
                const data = JSON.parse(event.data)
                if (data.status_updated) {
                    const { status } = data
                    if (status.do_not_notify) {
                        return
                    }
                    const { column } = this.props
                    if (column.timeline.statusBelongsTo(status)) {
                        document.title = "（新着あり）" + original_title
                    }
                }
            })
            document.addEventListener("mouseover", () => {
                document.title = original_title
            })
        }

        ws.addEventListener("message", event => {
            if (document.hasFocus()) {
                return
            }
            if (this.state.notification_enabled === false) {
                return
            }
            const data = JSON.parse(event.data)
            if (data.status_updated) {
                const { status } = data
                if (status.do_not_notify) {
                    return
                }
                const { column } = this.props
                if (column.timeline.statusBelongsTo(status)) {
                    let text = status.text
                    if (text.length > 140) {
                        text = text.slice(0, 140)
                    }
                    notification.push("新しい投稿があります", {
                        "body": `@${status.user.name}: ${text}`
                    })
                }
            }
        })
    }
    toggle = event => {
        event.preventDefault()
        this.setState({
            "notification_enabled": !this.state.notification_enabled
        })
        const { column } = this.props
        column.setDesktopNotificationEnabled(!this.state.notification_enabled)
    }
    render() {
        return (
            <div className="item tooltip" onClick={this.toggle}>
                <span className={classnames("icon notification user-defined-color-active", {
                    "active": this.state.notification_enabled
                })}></span>
                <span className="tooltip-message bottom">{this.state.notification_enabled ? "通知はオンです" : "通知はオフです"}</span>
            </div>
        )
    }
}

class SettingsMenuItem extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_active": false
        }
    }
    toggle = event => {
        event.preventDefault()
        this.setState({
            "is_active": !this.state.is_active
        })
    }
    render() {
        return (
            <div className={classnames("item timeline-header-dropdown-menu tooltip", {
                "active": this.state.is_active
            })} onClick={this.toggle}>
                <span className={classnames("icon settings user-defined-color-active", {
                    "active": this.state.is_active
                })}></span>
                <span className="tooltip-message bottom">チャンネル設定</span>
                <div className="timeline-header-dropdown-component search" onClick={event => event.stopPropagation()}>
                    <div className="inside">
                        未実装です
                    </div>
                </div>
            </div>
        )
    }
}

class SearchMenuItem extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_active": false
        }
    }
    toggle = event => {
        event.preventDefault()
        this.setState({
            "is_active": !this.state.is_active
        })
    }
    render() {
        return (
            <div className={classnames("item timeline-header-dropdown-menu tooltip", {
                "active": this.state.is_active
            })} onClick={this.toggle}>
                <span className={classnames("icon search user-defined-color-active", {
                    "active": this.state.is_active
                })}></span>
                <span className="tooltip-message bottom">投稿を検索</span>
                <div className="timeline-header-dropdown-component search" onClick={event => event.stopPropagation()}>
                    <div className="inside">
                        未実装です
                    </div>
                </div>
            </div>
        )
    }
}

const MoreMenuItem = ({ handle_close, handle_expand }) => {
    return (
        <div className="item timeline-header-dropdown-menu toggle-by-hover">
            <span className="icon more user-defined-color-hover"></span>
            <div className="timeline-header-dropdown-component more">
                <div className="inside">
                    <ul className="menu">
                        <a className="item user-defined-bg-color-hover" onClick={handle_close}>閉じる</a>
                        <a className="item user-defined-bg-color-hover" onClick={handle_expand}>横幅を最大化</a>
                        <span className="divider"></span>
                        <a className="item user-defined-bg-color-hover">指定の日付に移動する</a>
                    </ul>
                </div>
            </div>
        </div>
    )
}


export default class HeaderComponent extends Component {
    render() {
        const { column, handle_close, handle_expand, handle_back } = this.props
        const { recipient } = column.params
        const display_name = recipient.display_name.length > 0 ? recipient.display_name : recipient.name
        return (
            <div className="timeline-header-component">
                <div className="inside">
                    <div className="label-area message">
                        <img className="avatar" src={recipient.avatar_url} />
                        <span className="label">
                            <span className="display-name">{display_name}</span>
                            <span className="name">{recipient.name}</span>
                        </span>
                    </div>
                    <div className="menu">
                        <NotificationMenuItem column={column} />
                        <SearchMenuItem />
                        <MoreMenuItem handle_close={handle_close} handle_expand={handle_expand} />
                    </div>
                </div>
            </div>
        )
    }
}

