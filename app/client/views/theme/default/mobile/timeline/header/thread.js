import React, { Component } from "react"
import { observer } from "mobx-react"

@observer
export default class HeaderView extends Component {
    render() {
        const { in_reply_to_status } = this.props
        const { text } = in_reply_to_status
        const title = (text.length > 20) ? text.substr(0, 20) + "…" : text
        return (
            <div className="header">
                <div className="inside">
                    <h1 className="header-title">
                        {title}
                    </h1>
                </div>
            </div>
        )
    }
}