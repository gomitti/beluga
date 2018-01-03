import { Component } from "react";
import { Provider, observer } from "mobx-react";
import { useStrict, observable, action } from "mobx";
import TimelineView from "../../views/desktop/timeline";
import HeaderView from "../../views/desktop/header";
import PostboxView from "../../views/desktop/postbox";
import Head from "../../views/desktop/head"
import TimelineStore from "../../stores/timeline";
import StatusStore from "../../stores/status";

// mobxの状態をaction内でのみ変更可能にする
useStrict(true)

@observer
export default class App extends Component {
	// サーバー側でのみ呼ばれる
	// ここで返したpropsはクライアント側でも取れる
	static async getInitialProps({ query }) {
		return { ...query }
	}

	render() {
		const hashtagListView = this.props.hashtags.map(hashtag => {
			return <p><a href={`/server/${hashtag.server.name}/${hashtag.tagname}`}>${hashtag.server.name} / #{hashtag.tagname}</a></p>
		})
		return (
			<div>
				<Head title="Beluga" />
				<HeaderView logged_in={this.props.logged_in} />
				{hashtagListView}
			</div>
		);
	}
}