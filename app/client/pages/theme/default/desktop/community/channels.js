import classnames from "classnames"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import HeaderComponent from "../../../../../views/theme/default/desktop/header/column/community"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import Component from "../../../../../views/app"
import { build_status_body_views } from "../../../../../views/theme/default/desktop/parser"
import assert, { is_object, is_array } from "../../../../../assert"

const ListComponent = ({ community, channels }) => {
    const listViews = []
    channels.forEach(channel => {
        listViews.push(
            <a key={channel.id} className="item" href={`/${community.name}/${channel.name}`}>
                <span className="left-area">
                    <span className="icon"></span>
                    <span className="label">{channel.name}</span>
                </span>
                <span className="right-area">
                    <span className="stats statuses">
                        <span className="icon"></span>
                        <span className="label">{channel.statuses_count}</span>
                    </span>
                    <span className="stats members">
                        <span className="icon"></span>
                        <span className="label">{channel.members_count}</span>
                    </span>
                </span>
            </a>
        )
    })
    return (
        <ul className="channel-list">{listViews}</ul>
    )
}

export default class App extends Component {
    constructor(props) {
        super(props)
        const { community, community_channels } = props
        assert(is_object(community), "$community must be of type object")
        assert(is_array(community_channels), "$community_channels must be of type array")
    }
    render() {
        const { community, logged_in_user, joined_channels, community_channels, platform, device } = this.props
        return (
            <div id="app" className="app community-detail">
                <Head title={`${community.display_name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} device={device} />
                <NavigationbarComponent logged_in_user={logged_in_user} active="channels" />
                <div className="client">
                    <div className="inside">
                        <div className="community-detail-component">
                            <div className="inside">
                                <HeaderComponent community={community} active_tab="channels" />
                                <div className="channel-list-area">
                                    <p className="title">参加中のチャンネル</p>
                                    <ListComponent community={community} channels={joined_channels} />
                                </div>
                                <div className="channel-list-area">
                                    <p className="title">すべてのチャンネル</p>
                                    <ListComponent community={community} channels={community_channels} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}