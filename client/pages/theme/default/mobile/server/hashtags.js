import { Component } from "react"
import PropTypes from "prop-types"
import { configure } from "mobx"
import enums from "../../../../../enums"
import NavigationBarView from "../../../../../views/theme/default/mobile/navigationbar"
import HashtagListView from "../../../../../views/theme/default/desktop/column/hashtags"
import Head from "../../../../../views/theme/default/mobile/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

class App extends Component {
    // サーバー側でのみ呼ばれる
    // ここで返したpropsはクライアント側でも取れる
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        request.set_csrf_token(this.props.csrf_token)
    }
    render() {
        const { server, logged_in, joined_hashtags, server_hashtags, platform, device } = this.props
        return (
            <div id="app" className="timeline home">
                <Head title={`みつける / ${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} device={device} />
                <NavigationBarView server={server} logged_in={logged_in} active="hashtags" />
                <div id="content" className="timeline home">
                    <div className="column">
                        <HashtagListView hashtags={joined_hashtags} server={server} />
                    </div>
                </div>
            </div>
        )
    }
}
App.propTypes = {
    "joined_hashtags": PropTypes.array,
    "server_hashtags": PropTypes.array,
    "request_query": PropTypes.object
}
export default App