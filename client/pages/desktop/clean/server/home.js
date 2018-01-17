import { Component } from "react"
import { Provider, observer } from "mobx-react"
import { useStrict, observable, action } from "mobx"
import TimelineView from "../../../../views/desktop/clean/timeline"
import PostboxView from "../../../../views/desktop/clean/postbox"
import NavigationBarView from "../../../../views/desktop/clean/navigationbar"
import TimelineHeaderView from "../../../../views/desktop/clean/timeline/header/home"
import HashtagsCardView from "../../../../views/desktop/clean/card/hashtags"
import ServerCardView from "../../../../views/desktop/clean/card/server"
import Head from "../../../../views/desktop/clean/head"
import TimelineStore from "../../../../stores/timeline/home"
import StatusStore from "../../../../stores/status"
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
		const stores = []
		for (const status of this.props.statuses) {
			const store = new StatusStore(status)
			stores.push(store)
		}
		this.timeline.append(stores)
		if (request) {
			request.csrf_token = this.props.csrf_token
		}
	}

	render() {
		const { server, user, logged_in, hashtags } = this.props
		return (
			<div id="app" className="timeline home">
				<Head title={`@${user.name} / ${server.display_name} / ${config.site.name}`} />
				<NavigationBarView server={server} logged_in={logged_in} active="home" />
				<div id="content" className="timeline home">
					<div className="inside column-container">
						<div className="column timeline">
							<div className="inside timeline-container round">
								<TimelineHeaderView timeline={this.timeline} user={user} />
								<div className="content">
									<div className="vertical"></div>
									<PostboxView logged_in={logged_in} server={server} recipient={user} />
									<TimelineView timeline={this.timeline} options={{}} />
								</div>
							</div>
						</div>
						<div className="column server">
							<ServerCardView server={server} />
							<HashtagsCardView hashtags={hashtags} server={server} />
						</div>
					</div>
				</div>
			</div>
		)
	}
}