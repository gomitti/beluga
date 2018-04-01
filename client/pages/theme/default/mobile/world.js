import React, { Component } from "react"
import PropTypes from "prop-types"
import { configure } from "mobx"
import enums from "../../../../enums"
import NavigationBarView from "../../../../views/theme/default/mobile/navigationbar"
import ColumnStore from "../../../../stores/theme/default/mobile/column"
import ColumnView from "../../../../views/theme/default/mobile/column"
import Head from "../../../../views/theme/default/mobile/head"
import config from "../../../../beluga.config"
import { request } from "../../../../api"

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
        const { server, statuses_server, request_query } = props
        this.column = new ColumnStore(
            { "id": server.id },
            { server },
            {
                "type": enums.column.type.server,
                "timeline": {
                    "cancel_update": !!request_query.max_id,
                },
                "status": {
                    "show_belonging": true
                },
                "postbox": {
                    "is_hidden": true
                }
            },
            statuses_server
        )
        if (request) {
            request.csrf_token = this.props.csrf_token
        }
    }
    render() {
        const { server, logged_in, platform, device } = this.props
        return (
            <div id="app" className="timeline home">
                <Head title={`${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} device={device} />
                <NavigationBarView server={server} logged_in={logged_in} active="world" />
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