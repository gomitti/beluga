import { configure } from "mobx"
import classnames from "classnames"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import ServerDetailView from "../../../../../views/theme/default/desktop/column/server"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import Component from "../../../../../views/app"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    render() {
        const { server, logged_in_user, platform, device } = this.props
        return (
            <div id="app" className="server-about channels">
                <Head title={`${server.display_name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} device={device} />
                <NavigationBarView server={server} logged_in_user={logged_in_user} active="channels" />
                <div id="content" className={classnames("timeline channels", { "logged_in_user": !!logged_in_user })}>
                    <div className="inside column-container">
                        <div className="column server-about">
                            <ServerDetailView server={server} is_members_hidden={false} ellipsis_description={false} collapse_members={false} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}