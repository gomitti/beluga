import { configure } from "mobx"
import classnames from "classnames"
import assign from "../../../../../libs/assign"
import warning from "../../../../../libs/warning"
import assert, { is_object, is_array, is_string } from "../../../../../assert"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import Head from "../../../../../views/theme/default/desktop/head"
import EmojiPicker from "../../../../../views/theme/default/desktop/emoji"
import { MultipleColumnsContainerComponent, ColumnComponent } from "../../../../../views/theme/default/desktop/column"
import { ColumnOptions, ColumnSettings } from "../../../../../stores/theme/default/desktop/column"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import { get as get_desktop_settings } from "../../../../../settings/desktop"
import Tooltip from "../../../../../views/theme/default/desktop/tooltip"
import Component from "../../../../../views/app"
import { TimelineOptions } from "../../../../../stores/theme/default/desktop/timeline"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    render() {
        const { community, logged_in_user, channels, platform, pinned_emoji_shortnames, custom_emoji_shortnames, statuses_home, statuses_community } = this.props
        const desktop_settings = get_desktop_settings()
        const title = `${community.display_name} / ${config.site.name}`
        return (
            <div className={classnames("app timeline", {
                "multiple-columns": desktop_settings.multiple_columns_enabled
            })}>
                <Head title={title} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} active="statuses" />
                <div className={classnames("client timeline tooltip-offset-base emoji-picker-offset-base", { "logged_in_user": !!logged_in_user })}>
                    <MultipleColumnsContainerComponent {...this.props} />
                </div>
                <EmojiPicker
                    pinned_shortnames={pinned_emoji_shortnames}
                    custom_shortnames={custom_emoji_shortnames}
                    community={community} />
                <Tooltip />
            </div>
        )
    }
}