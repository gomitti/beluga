import { Component } from "react"
import { useStrict, observable, action } from "mobx"
import { observer } from "mobx-react"
import assert, { is_object, is_array, is_string } from "../../../assert"
import TimelineView from "../../../views/desktop/default/timeline"
import PostboxView from "../../../views/desktop/default/postbox"
import NavigationBarView from "../../../views/desktop/default/navigationbar"
import Head from "../../../views/desktop/default/head"
import ServerTimelineHeaderView from "../../../views/desktop/default/timeline/header/server"
import HomeTimelineHeaderView from "../../../views/desktop/default/timeline/header/home"
import EmojiPickerView, { EmojiPicker } from "../../../views/desktop/default/emoji"
import { ColumnContainer, ColumnView } from "../../../views/desktop/default/column"
import { options as column_options } from "../../../stores/column"
import HashtagsCardView from "../../../views/desktop/default/card/hashtags"
import ServerCardView from "../../../views/desktop/default/card/server"
import HomeTimelineStore from "../../../stores/timeline/home"
import ServerTimelineStore from "../../../stores/timeline/server"
import StatusStore from "../../../stores/status"
import config from "../../../beluga.config"
import settings, { enum_column_target, enum_column_type } from "../../../settings/desktop"
import { request } from "../../../api"

// mobxの状態をaction内でのみ変更可能にする
useStrict(true)

class ColumnContainerView extends ColumnContainer {
	constructor(props) {
		super(props)
		const { server, logged_in, statuses_home, statuses_server } = props
		assert(is_object(server), "@server must be object")
		assert(is_array(statuses_home) || statuses_home === null, "@statuses_home must be array or null")
		assert(is_array(statuses_server) || statuses_server === null, "@statuses_server must be array or null")
		if (logged_in) {
			assert(is_object(logged_in), "@logged_in must be object")
			this.open({ "user_id": logged_in.id, "server_id": server.id },
				{ "recipient": logged_in, server },
				Object.assign({}, column_options, { "type": enum_column_type.home }),
				statuses_home,
				enum_column_target.blank)
		}
		this.open({ "server_id": server.id },
			{ server },
			Object.assign({}, column_options, {
				"type": enum_column_type.server,
				"status": {
					"show_belonging": true
				},
				"postbox": {
					"is_hidden": true
				}
			}),
			statuses_server,
			enum_column_target.blank)
	}
	render() {
		const { server, hashtags, logged_in } = this.props
		const columnViews = []
		for (const column of this.columns) {
			columnViews.push(
				<ColumnView
					{...this.props}
					column={column}
					close={this.close}
					onClickHashtag={this.onClickHashtag}
					onClickMention={this.onClickMention}
				/>
			)
		}
		return (
			<div className="inside column-container">
				{columnViews}
				<div className="column server">
					<ServerCardView server={server} />
					<HashtagsCardView hashtags={hashtags} server={server} onClickHashtag={this.onClickHashtag} />
				</div>
			</div>
		)
	}
}

export default class App extends Component {
	// サーバー側でのみ呼ばれる
	// ここで返したpropsはクライアント側でも取れる
	static async getInitialProps({ query }) {
		return { ...query }
	}
	constructor(props) {
		super(props)
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
		const { server, logged_in, hashtags, platform, emoji_favorites, statuses_home, statuses_server } = this.props
		let title = `${server.display_name} / ${config.site.name}`
		if (logged_in) {
			title = `@${logged_in.name} / ` + title
		}
		return (
			<div id="app" className="timeline world">
				<Head title={title} platform={platform} logged_in={logged_in} />
				<NavigationBarView server={server} logged_in={logged_in} active="world" />
				<div id="content" className="timeline world">
					<ColumnContainerView {...this.props} />
				</div>
				<EmojiPickerView picker={this.emojipicker} favorites={emoji_favorites} />
			</div>
		)
	}
}