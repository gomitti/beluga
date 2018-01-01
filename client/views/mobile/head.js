import { Component } from "react";
import Head from "next/head"

export default class HeadView extends Component {
	render() {
		return (
			<Head>
				<meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0" />
				<meta charSet="utf-8" />
				<link rel="stylesheet" href="/css/style.css" />
				<title>{this.props.title}</title>
			</Head>
		);
	}
}