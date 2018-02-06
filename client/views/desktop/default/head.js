import { Component } from "react"
import Head from "next/head"
import version from "../../../version"

export default class HeadView extends Component {
	render() {
		let { platform, color } = this.props
		color = color ? color : "#477da7"
		return (
			<Head>
				<meta charSet="utf-8" />
				<link rel="stylesheet" href={`/css/theme/default/style.css?${version}`} />
				{platform ? <link rel="stylesheet" href={`/css/theme/default/${platform}.css?${version}`} /> : null}
				<title>{this.props.title}</title>
				<style>{`
					a,
					a:hover,
					.user-defined-color,
					.user-defined-color-active.active {
						color: ${color};
					}
					.user-defined-color-hover:hover {
						color: ${color} !important;
					}
					.user-defined-bg-color {
						background-color: ${color};
					}
					.user-defined-border-color-focus:focus,
					.user-defined-border-color-hover:hover,
					.user-defined-border-color-drag-entered.drag-entered,
					.user-defined-border-color-active.active {
						border-color: ${color};
					}
					.navigationbar-menu:hover > li > a.active:hover {
						color: ${color} !important;
						border-color: ${color} !important;
					}
					.status-header > .inside > .link:hover > .display-name {
						color: ${color} !important;
					}
				`}</style>
			</Head>
		);
	}
}