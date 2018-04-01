import { Component } from "react"
import { configure, observable, action } from "mobx"
import { observer } from "mobx-react"
import classnames from "classnames"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import warning from "../../../../libs/warning"
import assert, { is_object, is_array, is_string } from "../../../../assert"
import NavigationBarView from "../../../../views/theme/default/desktop/navigationbar"
import Head from "../../../../views/theme/default/desktop/head"
import EmojiPickerView, { EmojiPicker } from "../../../../views/theme/default/desktop/emoji"
import { ColumnContainer, ColumnView } from "../../../../views/theme/default/desktop/column"
import { default_options as column_options } from "../../../../stores/theme/default/desktop/column"
import HashtagsCardView from "../../../../views/theme/default/desktop/card/hashtags"
import ServerCardView from "../../../../views/theme/default/desktop/card/server"
import config from "../../../../beluga.config"
import { request } from "../../../../api"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

class ColumnContainerView extends ColumnContainer {
    constructor(props) {
        super(props)
        const { server, logged_in, statuses_home, statuses_server, request_query } = props
        assert(is_object(server), "@server must be of type object")
        assert(is_array(statuses_home) || statuses_home === null, "@statuses_home must be of type array or null")
        assert(is_array(statuses_server) || statuses_server === null, "@statuses_server must be of type array or null")
        if (logged_in) {
            assert(is_object(logged_in), "@logged_in must be of type object")
            const column = this.insert({ "user_id": logged_in.id, "server_id": server.id },
                { "recipient": logged_in, server },
                assign(column_options, {
                    "type": enums.column.type.home,
                    "is_closable": false,
                    "timeline": {
                        "cancel_update": !!request_query.max_id,
                    }
                }),
                statuses_home,
                enums.column.target.blank
            )
            column.is_closable = true
        }
        const column = this.insert(
            { "server_id": server.id },
            { server },
            {
                "type": enums.column.type.server,
                "is_closable": false,
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
            statuses_server,
            enums.column.target.blank,
        )
        column.is_closable = true
    }
    render() {
        const { server, hashtags, logged_in, request_query } = this.props
        const columnViews = []
        for (const column of this.columns) {
            columnViews.push(
                <ColumnView
                    {...this.props}
                    key={column.identifier}
                    column={column}
                    close={this.close}
                    serialize={this.serialize}
                    logged_in={logged_in}
                    request_query={request_query}
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
        return query
    }
    componentDidMount() {
        warning()
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
                <div id="content" className={classnames("timeline world", { "logged_in": !!logged_in })}>
                    <ColumnContainerView {...this.props} />
                </div>
                <EmojiPickerView picker={this.emojipicker} favorites={emoji_favorites} />
            </div>
        )
    }
}