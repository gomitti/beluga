import { Component } from "react"
import classnames from "classnames"
import ws from "../../../../../../websocket"
import assert, { is_object, is_function } from "../../../../../../assert"
import { ColumnStore } from "../../../../../../stores/theme/default/desktop/column"
import * as notification from "../../../../../../notification"
import ThreadTimelineStore from "../../../../../../stores/theme/default/desktop/timeline/thread"


class NotificationMenuItem extends Component {
    constructor(props) {
        super(props)
        const { timeline } = this.props
        assert(timeline instanceof ThreadTimelineStore, "$timeline must be an instance of TimelineStore")
        this.state = {
            "notification_enabled": false
        }
    }
    componentDidMount = () => {
        ws.addEventListener("message", event => {
            if (this.state.notification_enabled === false) {
                return
            }
            const data = JSON.parse(event.data)
            if (data.status_updated) {
                const { status } = data
                if (status.do_not_notify) {
                    return
                }
                const { timeline } = this.props
                if (timeline.statusBelongsTo(status)) {
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

export default class HeaderComponent extends Component {
    constructor(props) {
        super(props)
        const { in_reply_to_status } = props
        assert(is_object(in_reply_to_status), "$in_reply_to_status must be of type object")
    }
    render() {
        const { in_reply_to_status, timeline, handle_close, handle_expand, handle_back } = this.props
        const { community, channel } = in_reply_to_status
        return (
            <div className="timeline-header-component">
                <div className="inside">
                    <div className="label-area thread">
                        <span className="label">スレッド</span>
                        <span className="divider"></span>
                        <a className="link" href={`/${community.name}/${channel.name}`}>
                            <span className="icon channel"></span>
                            <span className="label">{channel.name}</span>
                        </a>
                    </div>
                    <div className="menu">
                        <NotificationMenuItem timeline={timeline} />
                        <MoreMenuItem handle_close={handle_close} handle_expand={handle_expand} />
                    </div>
                </div>
            </div>
        )
    }
}