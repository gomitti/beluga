import { configure, observable, action } from "mobx"
import { obcommunity } from "mobx-react"
import classnames from "classnames"
import assign from "../../../../../libs/assign"
import assert, { is_object } from "../../../../../assert"
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
    constructor(props) {
        super(props)
        const { community } = props
        assert(is_object(community), "$community must be of type object")
    }
    render() {
        const { channel, community, logged_in_user, platform, pinned_emoji_shortnames, custom_emoji_shortnames } = this.props
        const desktop_settings = get_desktop_settings()
        return (
            <div className={classnames("app timeline channel", {
                "multiple-columns": desktop_settings.multiple_columns_enabled
            })}>
                <Head title={`${channel.name} / ${community.display_name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
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