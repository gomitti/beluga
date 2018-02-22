import { Component } from "react"
import { useStrict, observable, action } from "mobx"
import { observer } from "mobx-react"
import assert, { is_object, is_array } from "../../../../assert"
import TimelineView from "../../../../views/desktop/default/timeline"
import PostboxView from "../../../../views/desktop/default/postbox"
import NavigationBarView from "../../../../views/desktop/default/navigationbar"
import TimelineHeaderView from "../../../../views/desktop/default/timeline/header/home"
import HashtagsCardView from "../../../../views/desktop/default/card/hashtags"
import ServerCardView from "../../../../views/desktop/default/card/server"
import EmojiPickerView, { EmojiPicker } from "../../../../views/desktop/default/emoji"
import { ColumnView, ColumnContainer } from "../../../../views/desktop/default/column"
import { options as column_options } from "../../../../stores/column"
import Head from "../../../../views/desktop/default/head"
import TimelineStore from "../../../../stores/timeline/home"
import StatusStore from "../../../../stores/status"
import config from "../../../../beluga.config"
import settings, { enum_column_target, enum_column_type } from "../../../../settings/desktop"
import { request } from "../../../../api"

// mobxの状態をaction内でのみ変更可能にする
useStrict(true)

class ColumnContainerView extends ColumnContainer {
	constructor(props) {
		super(props)
		const { server, user, statuses } = props
		assert(is_object(server), "@server must be object")
		assert(is_object(user), "@user must be object")
		assert(is_array(statuses) || statuses === null, "@statuses must be array or null")
		this.open({ "user_id": user.id, "server_id": server.id },
			{ "recipient": user, server },
			Object.assign({}, column_options, { "type": enum_column_type.home }),
			statuses,
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
					logged_in={logged_in}
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
		this.emojipicker = null
		if (request) {
			request.csrf_token = this.props.csrf_token
		}
		if (typeof window !== "undefined") {
			window.emojipicker = new EmojiPicker()
			this.emojipicker = emojipicker
		}
		if (typeof history !== "undefined") {
			history.scrollRestoration = "manual"
		}
	}
	render() {
		const { server, user, logged_in, hashtags, platform, emoji_favorites, statuses } = this.props
		return (
			<div id="app" className="timeline home">
				<Head title={`@${user.name} / ${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} />
				<NavigationBarView server={server} logged_in={logged_in} active="home" />
				<div id="content" className="timeline home">
					<ColumnContainerView {...this.props} />
				</div>
				<EmojiPickerView picker={this.emojipicker} favorites={emoji_favorites} />
			</div>
		)
	}
}