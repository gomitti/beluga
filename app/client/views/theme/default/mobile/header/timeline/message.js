import { Component } from "react"
import classnames from "classnames"

class SearchMenuItem extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_active": false
        }
    }
    toggle = event => {
        event.preventDefault()
        this.setState({
            "is_active": !this.state.is_active
        })
    }
    render() {
        return (
            <div className={classnames("item timeline-header-dropdown-menu", {
                "active": this.state.is_active
            })} onClick={this.toggle}>
                <span className={classnames("icon search user-defined-color-active", {
                    "active": this.state.is_active
                })}></span>
                <div className="timeline-header-dropdown-component search" onClick={event => event.stopPropagation()}>
                    <div className="inside">
                        未実装です
                    </div>
                </div>
            </div>
        )
    }
}

class MoreMenuItem extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_active": false
        }
    }
    toggle = event => {
        event.preventDefault()
        this.setState({
            "is_active": !this.state.is_active
        })
    }
    render() {
        return (
            <div className={classnames("item timeline-header-dropdown-menu", {
                "active": this.state.is_active
            })} onClick={this.toggle}>
                <span className={classnames("icon more user-defined-color-active", {
                    "active": this.state.is_active
                })}></span>
                <div className="timeline-header-dropdown-component more">
                    <div className="inside">
                        <ul className="menu">
                            <a className="item user-defined-bg-color-hover">指定の日付に移動する</a>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
}

export default class HeaderComponent extends Component {
    render() {
        const { recipient } = this.props
        const display_name = recipient.display_name.length > 0 ? recipient.display_name : recipient.name
        return (
            <div className="timeline-header-component">
                <div className="inside">
                    <div className="label-area">
                        <img className="avatar" src={recipient.avatar_url} />
                        <span className="label">
                            <span className="display-name">{display_name}</span>
                            <span className="name">{recipient.name}</span>
                        </span>
                    </div>
                    <div className="menu">
                        <SearchMenuItem />
                        <MoreMenuItem />
                    </div>
                </div>
            </div>
        )
    }
}

