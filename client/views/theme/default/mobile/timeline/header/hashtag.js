import React, { Component } from "react"
import PropTypes from "prop-types"
import { observer } from "mobx-react"

@observer
class HeaderView extends Component {
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
HeaderView.propTypes = {
    "hashtag": PropTypes.object,
}
export default HeaderView