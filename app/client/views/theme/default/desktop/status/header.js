import { Component } from "react"
import { split_emoji_unicode, parse_emoji_unicode, generate_image_from_emoji_shortname } from "../parser"
import { is_string } from "../../../../../assert"
import Tooltip from "../tooltip"

export class StatusHeaderDisplayNameView extends Component {
    render() {
        const { user } = this.props
        if (is_string(user.display_name) === false) {
            return null
        }
        if (user.display_name.length === 0) {
            return null
        }
        const components = split_emoji_unicode([user.display_name])
        const subviews = []
        components.forEach(substr => {
            // 絵文字（ユニコード）
            if (parse_emoji_unicode(substr, subviews)) {
                return
            }
            // それ以外
            subviews.push(substr)
        })
        return <span className="display-name element">{subviews}</span>
    }
}

export class StatusHeaderUserStatusView extends Component {
    render() {
        const { user } = this.props
        if (is_string(user.status_emoji_shortname) === false) {
            return null
        }
        const imageView = generate_image_from_emoji_shortname(user.status_emoji_shortname, "emoji-image", null)
        if (imageView === null) {
            return null
        }
        const content = user.status_text ?
            <p className="tooltip-user-status">{imageView}<span className="string">{user.status_text}</span></p>
            : <p className="tooltip-user-status">{imageView}</p>
        return (
            <button
                className="tooltip-button user-status element"
                ref={dom => this.dom = dom}
                onMouseEnter={() => Tooltip.show(this.dom, content)}
                onMouseOver={() => Tooltip.show(this.dom, content)}
                onMouseOut={() => Tooltip.hide()}>
                {imageView}
            </button>
        )
    }
}