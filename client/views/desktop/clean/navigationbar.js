import React, { Component } from "react"
import { request } from "../../../api"

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
										<a href={`/server/${server.name}/@${logged_in.name}`} className={active === "home" ? "active" : null}>
											<span className="text">ホーム</span>
										</a>
									</li>

								)
							}
						})()}
						<li>
							<a href="/mentions" className={active === "mentions" ? "active" : null}>
								<span className="text">つながり</span>
							</a>
						</li>
						{(() => {
							if (server) {
								return (
									<li>
										<a href={`/server/${server.name}/hashtags`} className={active === "hashtags" ? "active" : null}>
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
										<a href={`/world/${server.name}`} className={active === "world" ? "active" : null}>
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