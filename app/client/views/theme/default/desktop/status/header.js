import { Component } from "react"
import { split_emoji_unicode, parse_emoji_unicode } from "../parser"
import { is_string } from "../../../../../assert"
import Tooltip from "../tooltip"
import { get_image_url_for_shortname } from "../../../../../stores/theme/default/common/emoji"

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
        const { profile } = user
        if (!!profile === false) {
            return null
        }
        if (is_string(profile.status_emoji_shortname) === false) {
            return null
        }
        const image_url = get_image_url_for_shortname(profile.status_emoji_shortname, null)
        if (image_url === null) {
            return null
        }
        const imageView = <span className="emoji emoji-sizer" style={{ "backgroundImage": `url(${image_url})` }}></span>
        const content = profile.status_text ?
            <p className="tooltip-user-status">{imageView}<span className="string">{profile.status_text}</span></p>
            : <p className="tooltip-user-status">{imageView}</p>
        return (
            <button
                className="user-status element"
                ref={dom => this.dom = dom}
                onMouseEnter={() => Tooltip.show(this.dom, content)}
                onMouseOver={() => Tooltip.show(this.dom, content)}
                onMouseOut={() => Tooltip.hide()}>
                {imageView}
            </button>
        )
    }
}