import { configure } from "mobx"
import enums from "../../../../../enums"
import NavigationBarView from "../../../../../views/theme/default/mobile/navigationbar"
import ColumnStore from "../../../../../stores/theme/default/mobile/column"
import ColumnView from "../../../../../views/theme/default/mobile/column"
import ServerDetailView from "../../../../../views/theme/default/desktop/column/server"
import Head from "../../../../../views/theme/default/mobile/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import Component from "../../../../../views/app"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    render() {
        const { server, logged_in, platform, device } = this.props
        return (
            <div id="app" className="timeline home">
                <Head title={`${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} device={device} />
                <NavigationBarView server={server} logged_in={logged_in} active="channels" />
                <div id="content" className="timeline home">
                    <div className="column">
                        <ServerDetailView server={server} is_members_hidden={false} ellipsis_description={false} collapse_members={false} />
                    </div>
                </div>
            </div>
        )
    }
}