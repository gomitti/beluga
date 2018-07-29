import { Component } from "react"
import { split_emoji_unicode, parse_emoji_unicode, generate_image_from_emoji_shortname } from "../parser"
import { is_string } from "../../../../../assert"

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
        for (const substr of components) {
            // 絵文字（ユニコード）
            if (parse_emoji_unicode(substr, subviews)) {
                continue
            }
            // それ以外
            subviews.push(substr)
        }
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
        const status_text = user.status_text ? user.status_text : imageView
        return (
            <button className="tooltip-button user-status element">
                {imageView}
                <span className="tooltip">
                    {user.status_text ?
                        <span className="text">{imageView}<span className="string">{user.status_text}</span></span>
                        :
                        <span className="text">{status_text}</span>
                    }
                </span>
            </button>
        )
    }
}