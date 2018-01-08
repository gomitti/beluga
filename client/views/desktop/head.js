import { Component } from "react"
import Head from "next/head"
import config from "../../beluga.config"

export default class HeadView extends Component {
	render() {
		return (
			<Head>
				<meta charSet="utf-8" />
				<link rel="stylesheet" href={`/css/style.css?${config.version}`} />
				<title>{this.props.title}</title>
			</Head>
		);
	}
}