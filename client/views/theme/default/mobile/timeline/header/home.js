import React, { Component } from "react"
import PropTypes from "prop-types"
import { observer } from "mobx-react"

@observer
class HeaderView extends Component {
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
HeaderView.propTypes = {
    "user": PropTypes.object,
    "server": PropTypes.object,
}
export default HeaderView