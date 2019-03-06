import classnames from "classnames"
import CommunityDetailComponent from "../../../../../views/theme/default/desktop/column/community"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import Component from "../../../../../views/app"

export default class App extends Component {
    render() {
        const { platform, user, logged_in_user } = this.props
        return (
            <div className="app user-profile">
                <Head title={`${user.display_name}@${user.name} / ${config.site.name}`} platform={platform} />
                <NavigationbarComponent logged_in_user={logged_in_user} />
                <div className="create-channel-container">
                </div>
            </div>
        )
    }
}