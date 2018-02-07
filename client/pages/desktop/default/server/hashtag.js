import { Component } from "react"
import { useStrict } from "mobx"
import TimelineView from "../../../../views/desktop/default/timeline"
import PostboxView from "../../../../views/desktop/default/postbox"
import NavigationBarView from "../../../../views/desktop/default/navigationbar"
import TimelineHeaderView from "../../../../views/desktop/default/timeline/header/hashtag"
import HashtagsCardView from "../../../../views/desktop/default/card/hashtags"
import ServerCardView from "../../../../views/desktop/default/card/server"
import EmojiPickerView, { EmojiPicker } from "../../../../views/desktop/default/emoji"
import Head from "../../../../views/desktop/default/head"
import TimelineStore from "../../../../stores/timeline/hashtag"
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
		const { hashtag } = this.props
		this.timeline = new TimelineStore({ "id": hashtag.id }, { hashtag })
		const statuses = []
		for (const status of this.props.statuses) {
			const store = new StatusStore(status)
			statuses.push(store)
		}
		this.timeline.append(statuses)
		if (request) {
			request.csrf_token = this.props.csrf_token
		}
		this.emojipicker = null
		if (typeof window !== "undefined") {
			window.emojipicker = new EmojiPicker()
			this.emojipicker = emojipicker
		}
		if (typeof history !== "undefined") {
			history.scrollRestoration = "manual"
		}
	}

	render() {
		const { hashtag, server, logged_in, hashtags, platform, media } = this.props
		return (
			<div id="app" className="timeline hashtag">
				<Head title={`${hashtag.tagname} / ${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} />
				<NavigationBarView server={server} logged_in={logged_in} active="hashtags" />
				<div id="content" className="timeline hashtag">
					<div className="inside column-container">
						<div className="column left">
							<HashtagsCardView hashtags={hashtags} server={server} />
						</div>
						<div className="column timeline">
							<div className="inside timeline-container round">
								<TimelineHeaderView timeline={this.timeline} hashtag={hashtag} />
								<div className="content">
									<div className="vertical"></div>
									<PostboxView logged_in={logged_in} server={server} hashtag={this.props.hashtag} media={media} />
									<TimelineView timeline={this.timeline} options={{}} />
								</div>
							</div>
						</div>
						<div className="column server">
							<ServerCardView server={server} />
						</div>
					</div>
				</div>
				<EmojiPickerView picker={this.emojipicker} />
			</div>
		)
	}
}