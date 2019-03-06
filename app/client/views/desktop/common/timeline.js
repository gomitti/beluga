import React, { Component } from "react"
import { inject, observer } from "mobx-react"
import StatusComponent from "./status"
import StatusStore from "../../../stores/theme/default/common/status"
import { request } from "../../../api"
import ws from "../../../websocket"
import * as notification from "../../../notification"
import { setInterval } from "timers"

@observer
export default class TimelineComponent extends Component {
    componentDidMount() {
        ws.addEventListener("message", event => {
            const data = JSON.parse(event.data)
            if (data.status_updated) {
                const { status } = data
                if (status.do_not_notify) {
                    return
                }
                const { timeline } = this.props
                if (timeline.statusBelongsTo(status) && this.notification_enabled) {
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
    toggleNotification = event => {
        const checkbox = this.refs.notificationCheckbox
        this.notification_enabled = checkbox.checked
    }
    render() {
        const timeline = this.props.timeline;
        return (
            <div className="timeline">
                <p className="notification">新着通知:<input type="checkbox" ref="notificationCheckbox" onChange={this.toggleNotification} /></p >
                <div className="vertical"></div>
                {timeline.filteredStatuses.map((status) => {
                    if (status.deleted) {
                        return null
                    }
                    return <StatusComponent status={status} key={status.id} />
                })}
            </div>
        )
    }
}