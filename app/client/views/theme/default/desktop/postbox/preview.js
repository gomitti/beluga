import { Component } from "react"
import { build_status_body_views, split_emoji_unicode, parse_emoji_unicode } from "../parser"
import { is_string } from "../../../../../assert"
import { StatusHeaderDisplayNameComponent, StatusHeaderUserStatusComponent } from "../status/header"

export default class PreviewComponent extends Component {
    render() {
        const { status, is_hidden } = this.props
        if (is_hidden) {
            return null
        }
        const { text, user, community } = status
        const bodyView = build_status_body_views(text, community, {}, {})
        return (
            <div className="status">
                <div className="inside">
                    <div className="status-left">
                        <a href="/user/" className="avatar link">
                            <img src={user.avatar_url} className="postbox-preview-status-avatar-image image" />
                        </a>
                    </div>
                    <div className="status-right">
                        <div className="status-header">
                            <div className="inside">
                                <a href="/user/" className="link">
                                    <StatusHeaderDisplayNameComponent user={user} />
                                    <StatusHeaderUserStatusComponent user={user} />
                                    <span className="name verdana element">@{user.name}</span>
                                </a>
                            </div>
                        </div>
                        <div className="status-content">
                            <div className="body">{bodyView}</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}