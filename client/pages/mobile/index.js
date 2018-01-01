import { Component } from "react";
import { Provider, observer } from "mobx-react";
import { useStrict, observable, action } from "mobx";
import TimelineView from "../../views/mobile/timeline";
import HeaderView from "../../views/mobile/header";
import PostboxView from "../../views/mobile/postbox";
import Head from "../../views/mobile/head"
import TimelineStore from "../../stores/timeline";
import StatusStore from "../../stores/status";

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
		return { statuses: query.statuses }
	}

	componentWillMount() {
		const timeline = new TimelineStore("/statuses/hashtag", { "hashtag": "beluga" })
		for (const _status of this.props.statuses) {
			const status = new StatusStore()
			status.text = _status.text
			status.userName = _status.user_name
			status.createdAt = _status.created_at
			timeline.append(status)
		}
		this.addTimeline(timeline)
	}

	render() {
		return (
			<div>
				<Head title="Beluga" />
				<HeaderView />
				<PostboxView />
				{this.timelines.map(timeline =>
					<TimelineView timeline={timeline} />
				)}
			</div>
		);
	}
}