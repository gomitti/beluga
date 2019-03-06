import { configure } from "mobx"
import NavigationbarComponent from "../../../../../views/theme/default/mobile/navigationbar"
import ColumnStore from "../../../../../stores/theme/default/mobile/column"
import { ChannelColumnComponent } from "../../../../../views/theme/default/mobile/column"
import CommunityHeaderComponent from "../../../../../views/theme/default/mobile/banner/community"
import Head from "../../../../../views/theme/default/mobile/head"
import config from "../../../../../beluga.config"
import assert, { is_object, is_string, is_array } from "../../../../../assert"
import EmojiPicker from "../../../../../views/theme/default/mobile/emoji"
import Component from "../../../../../views/app"
import { default_options as column_options } from "../../../../../stores/theme/default/desktop/column"
import { ColumnOptions } from "../../../../../stores/theme/default/desktop/column"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    constructor(props) {
        super(props)
        const { columns, request_query, custom_emoji_shortnames,
            muted_users, muted_words, has_newer_statuses, has_older_statuses } = props
        assert(is_array(columns), "$columns must be of type array or null")
        assert(columns.length > 0, "$columns.length must be at least 1 ")
        assert(is_array(muted_users), "$muted_users must be of type array")
        assert(is_array(muted_words), "$muted_words must be of type array")
        assert(is_object(request_query), "$request_query must be of type object")

        assert(columns.length > 0, "length of $columns must be greater than 0")
        const column = columns[0]

        const { type, params, statuses } = column
        assert(is_object(params), "$params must be of type object")
        assert(is_array(statuses), "$statuses must be of type array")
        assert(is_string(type), "$type must be of type string")

        const column_options = new ColumnOptions()
        column_options.timeline.has_newer_statuses = has_newer_statuses
        column_options.timeline.has_older_statuses = has_older_statuses
        if (has_newer_statuses) {
            column_options.timeline.auto_reloading_enabled = false
        }
        column_options.timeline.muted_users = muted_users
        column_options.timeline.muted_words = muted_words

        this.column = new ColumnStore(type, params, column_options, statuses)
    }
    render() {
        const { community, logged_in_user, channel, platform, device, pinned_emoji_shortnames, custom_emoji_shortnames } = this.props
        return (
            <div className="app">
                <Head title={`${channel.name} / ${community.display_name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} device={device} />
                <NavigationbarComponent logged_in_user={logged_in_user} />
                <div className="client">
                    <CommunityHeaderComponent community={community} />
                    <ChannelColumnComponent {...this.props} column={this.column} />
                </div>
                <EmojiPicker
                    pinned_shortnames={pinned_emoji_shortnames}
                    custom_shortnames={custom_emoji_shortnames}
                    community={community} />
            </div>
        )
    }
}