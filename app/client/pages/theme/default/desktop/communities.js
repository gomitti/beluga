import classnames from "classnames"
import NavigationbarComponent from "../../../../views/theme/default/desktop/navigationbar"
import HeaderComponent from "../../../../views/theme/default/desktop/header/column/community"
import Head from "../../../../views/theme/default/desktop/head"
import config from "../../../../beluga.config"
import { request } from "../../../../api"
import Component from "../../../../views/app"
import { build_status_body_views } from "../../../../views/theme/default/desktop/parser"
import assert, { is_object, is_array } from "../../../../assert"

const ListComponent = ({ communities }) => {
    const listViews = []
    communities.forEach(community => {
        listViews.push(
            <a key={community.id} className="item" href={`/${community.name}`}>{community.name}</a>
        )
    })
    return (
        <ul className="community-list">{listViews}</ul>
    )
}

export default class App extends Component {
    constructor(props) {
        super(props)
    }
    render() {
        const { communities, logged_in_user, platform, device } = this.props
        return (
            <div id="app" className="app community-detail">
                <Head title={`コミュニティ一覧 / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} device={device} />
                <NavigationbarComponent logged_in_user={logged_in_user} active="channels" />
                <div className="client">
                    <div className="inside">
                        <div className="community-list-component">
                            <div className="inside">
                                <ListComponent communities={communities} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}