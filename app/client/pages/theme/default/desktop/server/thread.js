import { configure, observable, action } from "mobx"
import { observer } from "mobx-react"
import classnames from "classnames"
import enums from "../../../../../enums"
import assign from "../../../../../libs/assign"
import assert, { is_object, is_array, is_string } from "../../../../../assert"
import warning from "../../../../../libs/warning"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import EmojiPicker from "../../../../../views/theme/default/desktop/emoji"
import { ColumnView, MultipleColumnsContainerView } from "../../../../../views/theme/default/desktop/column"
import { ColumnOptions, ColumnSettings } from "../../../../../stores/theme/default/desktop/column"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import { add_custom_shortnames } from "../../../../../stores/theme/default/common/emoji"
import { get as get_desktop_settings } from "../../../../../settings/desktop"
import Tooltip from "../../../../../views/theme/default/desktop/tooltip"
import Component from "../../../../../views/app"
import { TimelineOptions } from "../../../../../stores/theme/default/desktop/timeline"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

class MultipleColumnsContainer extends MultipleColumnsContainerView {
    constructor(props) {
        super(props)
        const { server, logged_in_user, columns, in_reply_to_status, callback_change,
            muted_users, muted_words, request_query, has_newer_statuses, has_older_statuses } = props
        assert(is_object(server), "$server must be of type object")
        assert(is_object(logged_in_user), "$logged_in_user must be of type object")
        assert(is_object(in_reply_to_status), "$in_reply_to_status must be of type object")
        assert(is_array(columns), "$columns must be of type array or null")
        if (callback_change) {
            assert(is_function(callback_change), "$callback_change must be of type function")
            this.callback_change = callback_change
        }

        const desktop_settings = get_desktop_settings()
        if (desktop_settings.multiple_columns_enabled) {
            for (let column_index = 0; column_index < columns.length; column_index++) {
                const column = columns[column_index]
                const { type, param_ids, params, statuses } = column

                assert(is_object(param_ids), "$param_ids must be of type object")
                assert(is_object(params), "$params must be of type object")
                assert(is_array(statuses), "$statuses must be of type array")
                assert(is_string(type), "$type must be of type string")

                const column_options = new ColumnOptions()
                if (type === enums.column.type.server) {
                    column_options.status.show_source_link = true
                    column_options.postbox.is_hidden = true
                }
                if (type === enums.column.type.thread) {
                    if (params.in_reply_to_status.id === in_reply_to_status.id) {
                        column_options.is_closable = false
                    }
                }

                if (column_index == 0) {
                    column_options.timeline.has_newer_statuses = has_newer_statuses
                    column_options.timeline.has_older_statuses = has_older_statuses
                    if (has_newer_statuses) {
                        column_options.timeline.auto_reloading_enabled = false
                    }
                } else {
                    column_options.timeline.has_older_statuses = true
                }
                column_options.timeline.muted_users = muted_users
                column_options.timeline.muted_words = muted_words

                const column_settings = new ColumnSettings()

                this.insert(type, params,
                    column_options,
                    column_settings,
                    statuses,
                    enums.column.target.blank,
                    -1,
                    muted_users,
                    muted_words
                )
            }
        } else {
            assert(columns.length === 1, "length of $columns must be 1")
            const column = columns[0]
            const { type, params, statuses } = column
            const column_options = new ColumnOptions()

            column_options.timeline.has_newer_statuses = has_newer_statuses
            column_options.timeline.has_older_statuses = has_older_statuses
            if (has_newer_statuses) {
                column_options.timeline.auto_reloading_enabled = false
            }
            column_options.timeline.muted_users = muted_users
            column_options.timeline.muted_words = muted_words

            const column_settings = new ColumnSettings()

            this.insert(type, params,
                column_options,
                column_settings,
                statuses,
                enums.column.target.blank,
                -1,
                muted_users,
                muted_words
            )
        }
    }
}

export default class App extends Component {
    render() {
        const { in_reply_to_status, server, logged_in_user, channels, platform, pinned_emoji_shortnames, custom_emoji_shortnames, statuses } = this.props
        const desktop_settings = get_desktop_settings()
        const { text } = in_reply_to_status
        const title = (text.length > 50) ? text.substr(0, 50) + "…" : text
        return (
            <div id="app" className={classnames("timeline thread", {
                "multiple-columns": desktop_settings.multiple_columns_enabled
            })}>
                <Head title={`${title} / ${server.display_name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationBarView server={server} logged_in_user={logged_in_user} active="channels" />
                <div id="content" className={classnames("timeline channel tooltip-offset-base emoji-picker-offset-base", { "logged_in_user": !!logged_in_user })}>
                    <MultipleColumnsContainer {...this.props} />
                </div>
                <EmojiPicker
                    pinned_shortnames={pinned_emoji_shortnames}
                    custom_shortnames={custom_emoji_shortnames}
                    server={server} />
                <Tooltip />
            </div>
        )
    }
}