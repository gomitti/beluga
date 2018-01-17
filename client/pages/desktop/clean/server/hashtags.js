import { Component } from "react"
import { Provider, observer } from "mobx-react"
import { useStrict, observable, action } from "mobx"
import TimelineView from "../../../../views/desktop/clean/timeline"
import PostboxView from "../../../../views/desktop/clean/postbox"
import NavigationBarView from "../../../../views/desktop/clean/navigationbar"
import TimelineHeaderView from "../../../../views/desktop/clean/timeline/header/server"
import ServerCardView from "../../../../views/desktop/clean/card/server"
import HashtagsCardView from "../../../../views/desktop/clean/card/hashtags"
import Head from "../../../../views/desktop/clean/head"
import TimelineStore from "../../../../stores/timeline/server"
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
		const { server } = this.props
		this.timeline = new TimelineStore({ "server_id": server.id }, { server })
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
		const { server, logged_in, hashtags } = this.props
		return (
			<div id="app" className="timeline hashtags">
				<Head title={`みつける / ${server.display_name} / ${config.site.name}`} />
				<NavigationBarView server={server} logged_in={logged_in} active="hashtags" />
				<div id="content" className="timeline hashtags">
					<div className="inside column-container">
						<div className="column left">
							<HashtagsCardView hashtags={hashtags} server={server} />
						</div>
						<div className="column timeline card-included">
							<ServerCardView server={server} />
							<div className="inside timeline-container round">
								<TimelineHeaderView timeline={this.timeline} server={server} />
								<div className="content">
									<div className="vertical"></div>
									<TimelineView timeline={this.timeline} options={{
										"status": {
											"show_belonging": true
										}
									}} />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}