import { Component } from "react";
import { Provider, observer } from "mobx-react";
import { useStrict, observable, action } from "mobx";
import TimelineView from "../../../views/desktop/timeline";
import HeaderView from "../../../views/desktop/header";
import PostboxView from "../../../views/desktop/postbox";
import Head from "../../../views/desktop/head"
import TimelineStore from "../../../stores/timeline";
import StatusStore from "../../../stores/status";
import config from "../../../beluga.config"

// mobxの状態をaction内でのみ変更可能にする
useStrict(true)

@observer
export default class App extends Component {

	@observable timelines = []

	@action.bound
	addTimeline(timeline) {
		this.timelines.push(timeline)
	}

	// サーバー側でのみ呼ばれる
	// ここで返したpropsはクライアント側でも取れる
	static async getInitialProps({ query }) {
		return { ...query }
	}

	componentWillMount() {
		const timeline = new TimelineStore("/timeline/hashtag", { "id": this.props.hashtag.id })
		for (const status of this.props.statuses) {
			const store = new StatusStore(status)
			timeline.append(store)
		}
		this.addTimeline(timeline)
	}

	render() {
		return (
			<div>
				<Head title={`${this.props.server.display_name} / ${config.site.name}`} />
				<HeaderView server={this.props.server} logged_in={this.props.logged_in} />
				<PostboxView logged_in={this.props.logged_in} server={this.props.server} hashtag={this.props.hashtag} csrf_token={this.props.csrf_token} />
				{this.timelines.map(timeline =>
					<TimelineView timeline={timeline} />
				)}
			</div>
		);
	}
}