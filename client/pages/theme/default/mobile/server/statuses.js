import React, { Component } from "react"
import PropTypes from "prop-types"
import { configure } from "mobx"
import enums from "../../../../../enums"
import NavigationBarView from "../../../../../views/theme/default/mobile/navigationbar"
import ColumnStore from "../../../../../stores/theme/default/mobile/column"
import { ServerColumnView } from "../../../../../views/theme/default/mobile/column"
import Head from "../../../../../views/theme/default/mobile/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import assign from "../../../../../libs/assign"
import assert, { is_object, is_string, is_array } from "../../../../../assert"

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
        const { columns, request_query } = props
        assert(is_array(columns), "@columns must be of type array or null")
        assert(columns.length > 0, "@columns.length must be at least 1 ")
        assert(is_object(request_query), "@request_query must be of type object")

        const column = columns[0]
        const { type, params, statuses } = column

        assert(is_object(params), "@params must be of type object")
        assert(is_array(statuses), "@statuses must be of type array")
        assert(is_string(type), "@type must be of type string")

        this.column = new ColumnStore(type,
            params,
            {
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
            statuses
        )
        request.set_csrf_token(this.props.csrf_token)
    }
    render() {
        const { server, logged_in, platform, device } = this.props
        return (
            <div id="app" className="timeline home">
                <Head title={`${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} device={device} />
                <NavigationBarView server={server} logged_in={logged_in} active="statuses" />
                <div id="content" className="timeline home">
                    <ServerColumnView {...this.props} column={this.column} />
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