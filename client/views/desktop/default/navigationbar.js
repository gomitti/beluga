import React, { Component } from "react"
import { request } from "../../../api"
import classnames from "classnames"

export default class NavigationBarView extends Component {
	render() {
		const { server, logged_in, active } = this.props
		return (
			<div id="navigationbar">
				<div className="top"></div>
				<div className="bottom">
					<ul className="navigationbar-menu">
						{(() => {
							if (server && logged_in) {
								return (
									<li>
										<a href={`/server/${server.name}/@${logged_in.name}`} className={classnames("user-defined-color-hover user-defined-color-active user-defined-border-color-hover user-defined-border-color-active", {
											"active": active === "home"
										})}>
											<span className="icon home"></span>
											<span className="text">ホーム</span>
										</a>
									</li>

								)
							}
						})()}
						<li>
							<a href="/mentions" className={classnames("user-defined-color-hover user-defined-color-active user-defined-border-color-hover user-defined-border-color-active", {
								"active": active === "mentions"
							})}>
								<span className="icon mentions"></span>
								<span className="text">つながり</span>
							</a>
						</li>
						{(() => {
							if (server) {
								return (
									<li>
										<a href={`/server/${server.name}/hashtags`} className={classnames("user-defined-color-hover user-defined-color-active user-defined-border-color-hover user-defined-border-color-active", {
											"active": active === "hashtags"
										})}>
											<span className="icon hashtags"></span>
											<span className="text">みつける</span>
										</a>
									</li>

								)
							}
						})()}
						{(() => {
							if (server) {
								return (
									<li>
										<a href={`/world/${server.name}`} className={classnames("user-defined-color-hover user-defined-color-active user-defined-border-color-hover user-defined-border-color-active", {
											"active": active === "world"
										})}>
											<span className="icon world"></span>
											<span className="text">タイムライン</span>
										</a>
									</li>

								)
							}
						})()}
					</ul>
				</div>
			</div>
		)
	}
}