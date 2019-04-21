import { Component } from "react"
import classnames from "classnames"
import ws from "../../../../../../websocket"
import assert, { is_object, is_function } from "../../../../../../assert"
import { ColumnStore } from "../../../../../../stores/theme/default/desktop/column"
import * as notification from "../../../../../../notification"


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

const MoreMenuItem = ({ handle_close, handle_expand }) => {
    if (!!handle_close === false) {
        return null
    }
    if (!!handle_expand === false) {
        return null
    }
    return (
        <div className="item timeline-header-dropdown-menu toggle-by-hover">
            <span className="icon more user-defined-color-hover"></span>
            <div className="timeline-header-dropdown-component more" onClick={event => event.stopPropagation()}>
                <div className="inside">
                    <ul className="menu">
                        <a className="item user-defined-bg-color-hover" onClick={handle_close}>スレッドを閉じる</a>
                        <a className="item user-defined-bg-color-hover" onClick={handle_expand}>横幅を最大化</a>
                    </ul>
                </div>
            </div>
        </div>
    )
}

const LabelComponent = ({ community, channel }) => {
    if(community && channel){
        return (
            <div className="label-area thread">
                <span className="label">スレッド</span>
                <span className="divider"></span>
                <a className="link" href={`/${community.name}/${channel.name}`}>
                    <span className="icon channel"></span>
                    <span className="label">{channel.name}</span>
                </a>
            </div>
        )
    }
    return (
        <div className="label-area thread">
            <span className="label">スレッド</span>
        </div>
    )
}

export default class HeaderComponent extends Component {
    constructor(props) {
        super(props)
        const { column } = props
        assert(column instanceof ColumnStore, "$column must be an instance of ColumnStore: HeaderComponent::constructor()")
    }
    render() {
        const { column, handle_close, handle_expand, handle_back } = this.props
        const { in_reply_to_status, community, channel, timeline } = column.params
        return (
            <div className="timeline-header-component">
                <div className="inside">
                    <LabelComponent channel={channel} community={community} />
                    <div className="menu">
                        <NotificationMenuItem column={column} />
                        <MoreMenuItem handle_close={handle_close} handle_expand={handle_expand} />
                    </div>
                </div>
            </div>
        )
    }
}