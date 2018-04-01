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
                            <a href="/mentions" className={classnames("user-defined-color-active user-defined-border-color-active", {
                                "active": active === "mentions"
                            })}>
                                <span className="icon mentions"></span>
                            </a>
                        </li>
                        {(() => {
                            if (server) {
                                return (
                                    <li>
                                        <a href={`/server/${server.name}/hashtags`} className={classnames("user-defined-color-active user-defined-border-color-active", {
                                            "active": active === "hashtags"
                                        })}>
                                            <span className="icon hashtags"></span>
                                        </a>
                                    </li>
                                )
                            }
                        })()}
                        {(() => {
                            if (server) {
                                return (
                                    <li>
                                        <a href={`/world/${server.name}`} className={classnames("user-defined-color-active user-defined-border-color-active", {
                                            "active": active === "world"
                                        })}>
                                            <span className="icon world"></span>
                                        </a>
                                    </li>
                                )
                            }
                        })()}
                        <li>
                            <a href="/settings/profile" className={classnames("user-defined-color-active user-defined-border-color-active", {
                                "active": active === "settings"
                            })}>
                                <span className="icon settings"></span>
                            </a>
                        </li>
                        <li>
                            <a href="/settings/profile" className={classnames("user-defined-color-active user-defined-border-color-active", {
                                "active": active === "misc"
                            })}>
                                <span className="icon misc"></span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        )
    }
}