import { Component } from "react"
import classnames from "classnames"
import Toggle from "react-toggle"
import { observer } from "mobx-react"
import ws from "../../../../../../websocket"
import assert, { is_object, is_function } from "../../../../../../assert"
import { ColumnStore } from "../../../../../../stores/theme/default/desktop/column"
import * as notification from "../../../../../../notification"

@observer
export default class HeaderView extends Component {
    constructor(props) {
        super(props)
        const { channel, column } = props
        assert(is_object(channel), "$channel must be of type object")
        assert(column instanceof ColumnStore, "$column must be an instance of ColumnStore")
        assert(is_object(column.options), "$column.options must be of type object")
        this.state = {
            "is_settings_hidden": true
        }
    }
    componentDidMount() {
        ws.addEventListener("message", (e) => {
            const { column } = this.props
            if (column.settings.desktop_notification_enabled !== true) {
                return
            }
            const data = JSON.parse(e.data)
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
    toggleNotification = event => {
        const { column } = this.props
        column.settings.setDesktopNotificationEnabled(event.target.checked)
    }
    toggleSettings = event => {
        event.preventDefault()
        this.setState({
            "is_settings_hidden": !this.state.is_settings_hidden
        })
    }
    render() {
        const { server, channel, handle_close, handle_back, column } = this.props
        return (
            <div className="header">
                <div className="inside">
                    <h1 className="header-title">
                        #{channel.name}
                        <div className="header-options">
                            {column.history.length > 1 ? <a className="back-button" onClick={handle_back}>戻る</a> : null}
                            <button className={classnames("settings-button user-defined-color-active user-defined-color-hover", {
                                "active": !this.state.is_settings_hidden
                            })} onClick={this.toggleSettings}></button>
                        </div>
                    </h1>
                    <div className={classnames("header-settings", {
                        "hidden": this.state.is_settings_hidden
                    })}>
                        <section>
                            <label className="form-react-toggle">
                                <Toggle onChange={this.toggleNotification} checked={column.settings.desktop_notification_enabled} defaultChecked={column.settings.desktop_notification_enabled} />
                                <span>デスクトップ通知</span>
                            </label>
                        </section>
                        <section>
                            <a href={`/server/${server.name}/${channel.name}/settings/profile`}>チャンネル設定</a>
                        </section>
                        <section className="column-operations clearfix">
                            {column.options.is_closable ? <a className="close user-defined-color-hover" onClick={handle_close}>閉じる</a> : null}
                            <p className="move">
                                <a className="left user-defined-color-hover"></a>
                                <a className="right user-defined-color-hover"></a>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        )
    }
}