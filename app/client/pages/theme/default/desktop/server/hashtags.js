import { Component } from "react"
import { configure } from "mobx"
import Router from "next/router"
import classnames from "classnames"
import warning from "../../../../../libs/warning"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import ServerDetailView from "../../../../../views/theme/default/desktop/column/server"
import HashtagListView from "../../../../../views/theme/default/desktop/column/hashtags"
import EmojiPicker from "../../../../../views/theme/default/desktop/emoji"
import Head from "../../../../../views/theme/default/desktop/head"
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
        this.state = {
            "emojipicker": null
        }
        if (typeof history !== "undefined") {
            history.scrollRestoration = "manual"
        }

        // Safariのブラウザバック問題の解消
        if (typeof window !== "undefined") {
            Router.beforePopState(({ url, as, options }) => {
                return false
            });
        }
    }
    render() {
        const { server, logged_in, server_hashtags, platform, device, pinned_emoji } = this.props
        return (
            <div id="app" className="timeline hashtags">
                <Head title={`みつける / ${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} device={device} />
                <NavigationBarView server={server} logged_in={logged_in} active="hashtags" />
                <div id="content" className={classnames("timeline hashtags", { "logged_in": !!logged_in })}>
                    <div className="inside column-container">
                        <div className="column timeline">
                            <HashtagListView hashtags={server_hashtags} server={server} handle_click_hashtag={() => { }} />
                        </div>
                        <div className="column server">
                            <ServerDetailView
                                server={server}
                                is_members_hidden={false}
                                ellipsis_description={true}
                                collapse_members={true}
                                handle_click_hashtag={event => { return true }}
                                handle_click_mention={event => { return true }} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}