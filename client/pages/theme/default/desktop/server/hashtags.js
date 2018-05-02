import { Component } from "react"
import { configure } from "mobx"
import classnames from "classnames"
import TimelineView from "../../../../../views/theme/default/desktop/timeline"
import PostboxView from "../../../../../views/theme/default/desktop/postbox"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import TimelineHeaderView from "../../../../../views/theme/default/desktop/timeline/header/server"
import ServerCardView from "../../../../../views/theme/default/desktop/card/server"
import HashtagsCardView from "../../../../../views/theme/default/desktop/card/hashtags"
import EmojiPickerView, { EmojiPicker } from "../../../../../views/theme/default/desktop/emoji"
import Head from "../../../../../views/theme/default/desktop/head"
import TimelineStore from "../../../../../stores/theme/default/desktop/timeline/server"
import StatusStore from "../../../../../stores/theme/default/common/status"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {

    // サーバー側でのみ呼ばれる
    // ここで返したpropsはクライアント側でも取れる
    static async getInitialProps({ query }) {
        return query
    }

    constructor(props) {
        super(props)
        request.set_csrf_token(this.props.csrf_token)
        if (typeof history !== "undefined") {
            history.scrollRestoration = "manual"
        }
    }

    render() {
        const { server, logged_in, hashtags, platform, device, bookmark, emoji_favorites } = this.props
        return (
            <div id="app" className="timeline hashtags">
                <Head title={`みつける / ${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} device={device} />
                <NavigationBarView server={server} logged_in={logged_in} active="hashtags" />
                <div id="content" className={classnames("timeline hashtags", { "logged_in": !!logged_in })}>
                    <div className="inside column-container">
                        <div className="column left">
                            <HashtagsCardView hashtags={hashtags} server={server} />
                        </div>
                        <div className="column timeline card-included">
                            <ServerCardView server={server} />
                        </div>
                    </div>
                </div>
                <EmojiPickerView picker={this.emojipicker} bookmarks={emoji_favorites} />
            </div>
        )
    }
}