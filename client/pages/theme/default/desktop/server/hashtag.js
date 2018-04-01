import { Component } from "react"
import { configure, observable, action } from "mobx"
import { observer } from "mobx-react"
import classnames from "classnames"
import enums from "../../../../../enums"
import assign from "../../../../../libs/assign"
import warning from "../../../../../libs/warning"
import assert, { is_object, is_array } from "../../../../../assert"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import HashtagsCardView from "../../../../../views/theme/default/desktop/card/hashtags"
import ServerCardView from "../../../../../views/theme/default/desktop/card/server"
import EmojiPickerView, { EmojiPicker } from "../../../../../views/theme/default/desktop/emoji"
import { ColumnView, ColumnContainer } from "../../../../../views/theme/default/desktop/column"
import { default_options as column_options } from "../../../../../stores/theme/default/desktop/column"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

class ColumnContainerView extends ColumnContainer {
    constructor(props) {
        super(props)
        const { hashtag, statuses, request_query } = props
        assert(is_object(hashtag), "@hashtag must be of type object")
        assert(is_array(statuses) || statuses === null, "@statuses must be of type array or null")
        const column = this.insert(
            { "id": hashtag.id },
            { hashtag },
            {
                "type": enums.column.type.hashtag,
                "is_closable": false,
                "timeline": {
                    "cancel_update": !!request_query.max_id,
                }
            },
            statuses,
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
                <div className="column left">
                    <HashtagsCardView hashtags={hashtags} server={server} onClickHashtag={this.onClickHashtag} />
                </div>
                {columnViews}
                <div className="column server">
                    <ServerCardView server={server} />
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
        const { hashtag, server, logged_in, hashtags, platform, emoji_favorites, statuses } = this.props
        return (
            <div id="app" className="timeline hashtag">
                <Head title={`${hashtag.tagname} / ${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} />
                <NavigationBarView server={server} logged_in={logged_in} active="hashtags" />
                <div id="content" className={classnames("timeline hashtag", { "logged_in": !!logged_in })}>
                    <ColumnContainerView {...this.props} />
                </div>
                <EmojiPickerView picker={this.emojipicker} favorites={emoji_favorites} />
            </div>
        )
    }
}