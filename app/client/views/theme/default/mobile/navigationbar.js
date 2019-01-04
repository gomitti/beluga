import { Component } from "react"
import classnames from "classnames"

export default class NavigationBarView extends Component {
    render() {
        const { server, logged_in, active } = this.props
        return (
            <div id="navigationbar">
                <div className="inside">
                    <ul className="navigationbar-menu">
                        {(() => {
                            if (server && logged_in) {
                                return (
                                    <li>
                                        <a href={`/server/${server.name}/@${logged_in.name}`} className={classnames("user-defined-color-active user-defined-border-color-active", {
                                            "active": active === "home"
                                        })}>
                                            <span className="icon home"></span>
                                        </a>
                                    </li>
                                )
                            }
                        })()}
                        <li>
                            <a href={`/server/${server.name}/notifications`} className={classnames("user-defined-color-active user-defined-border-color-active", {
                                "active": active === "notifications"
                            })}>
                                <span className="icon notifications"></span>
                            </a>
                        </li>
                        {server ?
                            <li>
                                <a href={`/server/${server.name}/channels`} className={classnames("user-defined-color-active user-defined-border-color-active", {
                                    "active": active === "channels"
                                })}>
                                    <span className="icon channels"></span>
                                </a>
                            </li>
                            : null
                        }
                        {server ?
                            <li>
                                <a href={`/server/${server.name}/statuses`} className={classnames("user-defined-color-active user-defined-border-color-active", {
                                    "active": active === "statuses"
                                })}>
                                    <span className="icon world"></span>
                                </a>
                            </li>
                            : null
                        }
                        <li>
                            <a href="/settings/profile" className={classnames("user-defined-color-active user-defined-border-color-active", {
                                "active": active === "settings"
                            })}>
                                <span className="icon settings"></span>
                            </a>
                        </li>
                        {/* <li>
                            <a href="/settings/profile" className={classnames("user-defined-color-active user-defined-border-color-active", {
                                "active": active === "misc"
                            })}>
                                <span className="icon misc"></span>
                            </a>
                        </li> */}
                    </ul>
                </div>
            </div>
        )
    }
}