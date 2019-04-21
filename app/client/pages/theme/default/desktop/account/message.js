import { configure } from "mobx"
import classnames from "classnames"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import Head from "../../../../../views/theme/default/desktop/head"
import EmojiPicker from "../../../../../views/theme/default/desktop/emoji"
import config from "../../../../../beluga.config"
import { MultipleColumnsContainerComponent } from "../../../../../views/theme/default/desktop/column"
import { get as get_desktop_settings } from "../../../../../settings/desktop"
import Component from "../../../../../views/app"
import Toast from "../../../../../views/theme/default/desktop/toast"
import Tooltip from "../../../../../views/theme/default/desktop/tooltip"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

const do_nothing = () => true

export default class App extends Component {
    render() {
        const { logged_in_user, recipient, platform, device, pinned_emoji_shortnames, pinned_media, recent_uploads } = this.props
        const desktop_settings = get_desktop_settings()
        const display_name = (recipient.display_name && recipient.display_name.length > 0) ? recipient.display_name : recipient.name
        const title = `メッセージ / ${display_name}@${recipient.name} / ${config.site.name}`
        return (
            <div className={classnames("app timeline channel", {
                "multiple-columns": desktop_settings.multiple_columns_enabled
            })}>
                <Head title={title} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} active="channels" />
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