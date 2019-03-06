import { Component } from "react"
import { split_emoji_unicode, parse_emoji_unicode } from "../../desktop/parser"
import { is_string } from "../../../../../assert"
import { get_image_url_by_shortname_or_null } from "../../../../../stores/theme/default/common/emoji"

export class StatusHeaderDisplayNameComponent extends Component {
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

export class StatusHeaderUserStatusComponent extends Component {
    render() {
        const { user } = this.props
        if (is_string(user.status_emoji_shortname) === false) {
            return null
        }
        const image_url = get_image_url_by_shortname_or_null(user.status_emoji_shortname, null)
        if (image_url === null) {
            return null
        }
        const imageView = <span className="emoji emoji-sizer" style={{ "backgroundImage": `url(${image_url})` }}></span>
        if (imageView === null) {
            return null
        }
        return <span className="user-status element">{imageView}</span>
    }
}