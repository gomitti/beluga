import React, { Component } from "react"
import PropTypes from "prop-types"
import { configure } from "mobx"
import enums from "../../../../../enums"
import NavigationBarView from "../../../../../views/theme/default/mobile/navigationbar"
import ColumnStore from "../../../../../stores/theme/default/mobile/column"
import ColumnView from "../../../../../views/theme/default/mobile/column"
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
        const { server, user, statuses, request_query } = props
        this.column = new ColumnStore(
            { "user_id": user.id, "server_id": server.id },
            { "recipient": user, server },
            {
                "type": enums.column.type.home,
                "timeline": {
                    "cancel_update": !!request_query.max_id,
                }
            },
            statuses
        )
        request.set_csrf_token(this.props.csrf_token)
    }
    render() {
        const { server, user, logged_in, platform, device } = this.props
        return (
            <div id="app" className="timeline home">
                <Head title={`@${user.name} / ${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} device={device} />
                <NavigationBarView server={server} logged_in={logged_in} active="home" />
                <div id="content" className="timeline home">
                    <ColumnView {...this.props} column={this.column} />
                </div>
            </div>
        )
    }
}
App.propTypes = {
    "server": PropTypes.object,
    "user": PropTypes.object,
    "statuses": PropTypes.array,
    "request_query": PropTypes.object
}
export default App