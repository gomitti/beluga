import { Component } from "react"
import { configure } from "mobx"
import Router from "next/router"
import classnames from "classnames"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import ServerDetailView from "../../../../../views/theme/default/desktop/column/server"
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
        const { server, logged_in, platform, device } = this.props
        return (
            <div id="app" className="server-about hashtags">
                <Head title={`${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} device={device} />
                <NavigationBarView server={server} logged_in={logged_in} active="hashtags" />
                <div id="content" className={classnames("timeline hashtags", { "logged_in": !!logged_in })}>
                    <div className="inside column-container">
                        <div className="column server-about">
                            <ServerDetailView server={server} is_members_hidden={false} ellipsis_description={false} collapse_members={false} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}