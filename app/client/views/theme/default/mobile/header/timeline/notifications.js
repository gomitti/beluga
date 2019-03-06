import React, { Component } from "react"
import { observer } from "mobx-react"

@observer
export default class HeaderComponent extends Component {
    render() {
        return (
            <div className="header">
                <div className="inside">
                    <h1 className="header-title">
                        通知
                    </h1>
                </div>
            </div>
        )
    }
}