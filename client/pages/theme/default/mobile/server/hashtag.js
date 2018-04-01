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
        const { hashtag, statuses, request_query } = props
        this.column = new ColumnStore(
            { "id": hashtag.id },
            { hashtag },
            {
                "type": enums.column.type.hashtag,
                "timeline": {
                    "cancel_update": !!request_query.max_id,
                }
            },
            statuses
        )
        if (request) {
            request.csrf_token = this.props.csrf_token
        }
    }
    render() {
        const { server, logged_in, hashtag, platform, device, statuses } = this.props
        return (
            <div id="app" className="timeline home">
                <Head title={`${hashtag.tagname} / ${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} device={device} />
                <NavigationBarView server={server} logged_in={logged_in} active="hashtags" />
                <div id="content" className="timeline home">
                    <ColumnView {...this.props} column={this.column} />
                </div>
            </div>
        )
    }
}
App.propTypes = {
    "hashtag": PropTypes.object,
    "statuses": PropTypes.array,
    "request_query": PropTypes.object
}
export default App