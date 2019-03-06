import React, { Component } from "react"
import { observer } from "mobx-react"
import config from "../../../../../beluga.config"
import { get_image_url_by_shortname_or_null } from "../../../../../stores/theme/default/common/emoji";

@observer
export default class ReactionsComponent extends Component {
    toggle(shortname) {
        const { status } = this.props
        status.reactions.toggle(shortname)
    }
    render() {
        const { status, community } = this.props
        if (status.reactions.count == 0) {
            return null
        }
        const community_id = community ? community.id : null
        const buttons = []
        status.reactions.list.forEach(item => {
            const { shortname, count } = item
            const image_url = get_image_url_by_shortname_or_null(shortname, community_id)
            buttons.push(
                <button className="status-reaction" onClick={event => this.toggle(shortname)} key={shortname}>
                    <span className="emoji emoji-sizer" style={{ "backgroundImage": `url(${image_url})` }}></span>
                    <span className="count">{count}</span>
                </button>
            )
        })
        return (
            <div className="status-reactions bar">
                {buttons}
            </div>
        )
    }
}