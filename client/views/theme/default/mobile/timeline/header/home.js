import React, { Component } from "react"
import PropTypes from "prop-types"
import { observer } from "mobx-react"

@observer
class HeaderView extends Component {
    render() {
        const { recipient } = this.props
        return (
            <div className="header">
                <div className="inside">
                    <h1 className="header-title">
                        @{recipient.name}
                    </h1>
                </div>
            </div>
        )
    }
}
HeaderView.propTypes = {
    "recipient": PropTypes.object,
    "server": PropTypes.object,
}
export default HeaderView