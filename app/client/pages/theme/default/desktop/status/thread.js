import { configure } from "mobx"
import classnames from "classnames"
import assign from "../../../../../libs/assign"
import assert, { is_object, is_array, is_string } from "../../../../../assert"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import EmojiPicker from "../../../../../views/theme/default/desktop/emoji"
import { MultipleColumnsContainerComponent } from "../../../../../views/theme/default/desktop/column"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import { get as get_desktop_settings } from "../../../../../settings/desktop"
import Tooltip from "../../../../../views/theme/default/desktop/tooltip"
import Component from "../../../../../views/app"
import Toast from "../../../../../views/theme/default/desktop/toast"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    render() {
        const { in_reply_to_status, logged_in_user, platform, pinned_emoji_shortnames, custom_emoji_shortnames, statuses } = this.props
        const desktop_settings = get_desktop_settings()
        const { text } = in_reply_to_status
        const title = (text.length > 50) ? text.substr(0, 50) + "…" : text
        return (
            <div className={classnames("app timeline thread", {
                "multiple-columns": desktop_settings.multiple_columns_enabled
            })}>
                <Head title={`${title} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} />
                <Toast />
                <div className={classnames("client timeline channel tooltip-offset-base emoji-picker-offset-base", { "logged_in_user": !!logged_in_user })}>
                    <MultipleColumnsContainerComponent {...this.props} />
                </div>
                <EmojiPicker />
                <Tooltip />
            </div>
        )
    }
}