import classnames from "classnames"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import HeaderComponent from "../../../../../views/theme/default/desktop/header/column/community"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import Component from "../../../../../views/app"
import { build_status_body_views } from "../../../../../views/theme/default/desktop/parser"
import assert, { is_object } from "../../../../../assert"

export default class App extends Component {
    constructor(props) {
        super(props)
        const { community } = props
        assert(is_object(community), "$community must be of type object")
        const { description } = community
        this.descriptionView = build_status_body_views(description, community, {}, {})
    }
    render() {
        const { community, logged_in_user, platform, device } = this.props
        return (
            <div id="app" className="app community-detail">
                <Head title={`${community.display_name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} device={device} />
                <NavigationbarComponent logged_in_user={logged_in_user} active="channels" />
                <div className="client">
                    <div className="inside">
                        <div className="community-detail-component">
                            <div className="inside">
                                <HeaderComponent community={community} active_tab="about" />
                                <div className="description-area">
                                    {this.descriptionView}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}