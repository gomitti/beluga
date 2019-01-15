import { configure } from "mobx"
import classnames from "classnames"
import warning from "../../../../../libs/warning"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import ServerDetailView from "../../../../../views/theme/default/desktop/column/server"
import ChannelListView from "../../../../../views/theme/default/desktop/column/channels"
import EmojiPicker from "../../../../../views/theme/default/desktop/emoji"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import Component from "../../../../../views/app"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "emojipicker": null
        }
    }
    render() {
        const { server, logged_in_user, server_channels, platform, device, pinned_emoji } = this.props
        return (
            <div id="app" className="timeline channels">
                <Head title={`みつける / ${server.display_name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} device={device} />
                <NavigationBarView server={server} logged_in_user={logged_in_user} active="channels" />
                <div id="content" className={classnames("timeline channels", { "logged_in_user": !!logged_in_user })}>
                    <div className="inside column-container">
                        <div className="column timeline">
                            <ChannelListView channels={server_channels} server={server} handle_click_channel={() => { }} />
                        </div>
                        <div className="column server">
                            <ServerDetailView
                                server={server}
                                is_members_hidden={false}
                                ellipsis_description={true}
                                collapse_members={true}
                                handle_click_channel={event => { return true }}
                                handle_click_mention={event => { return true }} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}