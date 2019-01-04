import classnames from "classnames"
import ServerDetailView from "../../../../../views/theme/default/desktop/column/server"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import Component from "../../../../../views/app"

export default class App extends Component {
    render() {
        const { platform, user, logged_in } = this.props
        return (
            <div id="app" className="user-profile">
                <Head title={`${user.display_name}@${user.name} / ${config.site.name}`} platform={platform} />
                <NavigationBarView logged_in={logged_in} />
                <div className="create-channel-container">
                </div>
            </div>
        )
    }
}