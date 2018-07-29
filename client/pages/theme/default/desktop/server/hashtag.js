import { Component } from "react"
import { configure, observable, action } from "mobx"
import { observer } from "mobx-react"
import classnames from "classnames"
import enums from "../../../../../enums"
import assign from "../../../../../libs/assign"
import assert, { is_object, is_array, is_string } from "../../../../../assert"
import warning from "../../../../../libs/warning"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import { EmojiPickerWindow, EmojiPickerStore } from "../../../../../views/theme/default/desktop/emoji"
import { ColumnView, MultipleColumnsContainerView } from "../../../../../views/theme/default/desktop/column"
import { default_options as default_column_options } from "../../../../../stores/theme/default/desktop/column"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import { add_custome_emojis } from "../../../../../stores/emoji"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

class MultipleColumnsContainer extends MultipleColumnsContainerView {
    constructor(props) {
        super(props)
        const { server, logged_in, columns, hashtag } = props
        assert(is_object(server), "@server must be of type object")
        assert(is_object(logged_in), "@logged_in must be of type object")
        assert(is_array(columns), "@columns must be of type array or null")
        columns.forEach(column => {
            const { type, param_ids, params, statuses } = column

            assert(is_object(param_ids), "@param_ids must be of type object")
            assert(is_object(params), "@params must be of type object")
            assert(is_array(statuses), "@statuses must be of type array")
            assert(is_string(type), "@type must be of type string")

            const options = assign(default_column_options)

            if (type === "server") {
                options.status.show_belonging = true
                options.postbox.is_hidden = true
            }

            if (type === "hashtag") {
                if (params.hashtag.id === hashtag.id) {
                    options.is_closable = false
                }
                if (params.hashtag.joined === false) {
                    options.postbox.is_hidden = true
                }
            }

            this.insert(type, params,
                options,
                statuses,
                enums.column.target.blank,
                -1
            )
        })
    }
}

const compare_shortname = (a, b) => {
    if (a < b) {
        return -1
    }
    if (a > b) {
        return 1
    }
    return 0
}

export default class App extends Component {
    // サーバー側でのみ呼ばれる
    // ここで返したpropsはクライアント側でも取れる
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        const { csrf_token, custome_emoji } = props
        request.set_csrf_token(csrf_token)
        add_custome_emojis(custome_emoji)

        this.state = {
            "emojipicker": null
        }

        if (typeof history !== "undefined") {
            history.scrollRestoration = "manual"
        }

        this.custom_shortnames = []
        custome_emoji.forEach(emoji => {
            this.custom_shortnames.push(emoji.shortname)
        })
        this.custom_shortnames.sort(compare_shortname)
    }
    componentDidMount() {
        warning()
        const { server } = this.props
        window.emojipicker = new EmojiPickerStore(server)
        this.setState({
            "emojipicker": window.emojipicker
        })
    }
    render() {
        const { hashtag, server, logged_in, hashtags, platform, pinned_emoji, statuses } = this.props
        return (
            <div id="app" className="timeline hashtag">
                <Head title={`${hashtag.tagname} / ${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} />
                <NavigationBarView server={server} logged_in={logged_in} active="hashtags" />
                <div id="content" className={classnames("timeline hashtag", { "logged_in": !!logged_in })}>
                    <MultipleColumnsContainer {...this.props} />
                </div>
                <EmojiPickerWindow picker={this.state.emojipicker} pinned={pinned_emoji} custom={this.custom_shortnames} server={server} />
            </div>
        )
    }
}