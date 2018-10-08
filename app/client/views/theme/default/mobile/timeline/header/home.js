import React, { Component } from "react"
import { observer } from "mobx-react"

@observer
export default class HeaderView extends Component {
    render() {
        const { user } = this.props
        return (
            <div className="header">
                <div className="inside">
                    <h1 className="header-title">
                        @{user.name}
                    </h1>
                </div>
            </div>
        )
    }
}