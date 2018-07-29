import React, { Component } from "react"
import { observer } from "mobx-react"
import config from "../../../../../beluga.config"
import { get_image_url_from_shortname } from "../../../../../stores/emoji";

@observer
export default class ReactionsView extends Component {
    toggle(shortname) {
        const { status } = this.props
        status.reactions.toggle(shortname)
    }
    render() {
        const { status, server } = this.props
        if (status.reactions.count == 0) {
            return null
        }
        const buttons = []
        for (const item of status.reactions.list) {
            const { shortname, count } = item
            buttons.push(
                <button className="status-reaction" onClick={event => this.toggle(shortname)}>
                    <img className="emoji" src={get_image_url_from_shortname(shortname, server.id)} />
                    <span className="count">{count}</span>
                </button>
            )
        }
        return (
            <div className="status-reactions">
                {buttons}
            </div>
        )
    }
}