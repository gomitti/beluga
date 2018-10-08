import React, { Component } from "react"
import { observer } from "mobx-react"

@observer
export default class HeaderView extends Component {
    render() {
        const { hashtag } = this.props
        return (
            <div className="header">
                <div className="inside">
                    <h1 className="header-title">
                        #{hashtag.tagname}
                    </h1>
                </div>
            </div>
        )
    }
}