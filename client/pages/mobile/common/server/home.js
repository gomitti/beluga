import { Component } from "react"
import { Provider, observer } from "mobx-react";
import { useStrict, observable, action } from "mobx";
import TimelineView from "../../../../views/mobile/timeline";
import HeaderView from "../../../../views/mobile/header";
import PostboxView from "../../../../views/mobile/postbox";
import Head from "../../../../views/mobile/head"
import TimelineStore from "../../../../stores/timeline/home";
import StatusStore from "../../../../stores/status";
import config from "../../../../beluga.config"
import { request } from "../../../../api"

// mobxの状態をaction内でのみ変更可能にする
useStrict(true)

export default class App extends Component {
	// サーバー側でのみ呼ばれる
	// ここで返したpropsはクライアント側でも取れる
	static async getInitialProps({ query }) {
		return { ...query }
	}
	constructor(props) {
		super(props)
		const { server, user, logged_in } = props
		this.timeline = new TimelineStore({ "user_id": user.id, "server_id": server.id }, { user, server })
		const statuses = []
		for (const status of this.props.statuses) {
			const store = new StatusStore(status)
			statuses.push(store)
		}
		this.timeline.append(statuses)
		if (request) {
			request.csrf_token = this.props.csrf_token
		}
	}
	render() {
		return (
			<div>
				<Head title={`${this.props.server.display_name} / ${config.site.name}`} />
				<HeaderView server={this.props.server} logged_in={this.props.logged_in} />
				<PostboxView logged_in={this.props.logged_in} server={this.props.server} hashtag={this.props.hashtag} />
				<TimelineView timeline={this.timeline} />
			</div>
		);
	}
}