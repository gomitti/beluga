import React, { Component } from "react"
import PropTypes from "prop-types"
import { observer } from "mobx-react"

@observer
class HeaderView extends Component {
    render() {
        const { server } = this.props
        return (
            <div className="header">
                <div className="inside">
                    <h1 className="header-title">
                        {server.display_name}
                    </h1>
                </div>
            </div>
        )
    }
}
HeaderView.propTypes = {
    "server": PropTypes.object,
}
export default HeaderView