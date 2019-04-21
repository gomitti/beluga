import classnames from "classnames"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import HeaderComponent from "../../../../../views/theme/default/desktop/header/column/community"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import Component from "../../../../../views/app"
import { build_status_body_views } from "../../../../../views/theme/default/desktop/parser"
import assert, { is_object, is_array } from "../../../../../assert"

const ListComponent = ({ users }) => {
    const listViews = []
    users.forEach(user => {
        const display_name = (user.display_name && user.display_name.length > 0) ? user.display_name : user.name
        listViews.push(
            <a key={user.id} className="item" href={`/user/${user.name}`}>
                <img className="avatar" src={user.avatar_url} />
                <span className="display-name">{display_name}</span>
                <span className="name">{user.name}</span>
            </a>
        )
    })
    return (
        <ul className="member-list">{listViews}</ul>
    )
}

const MemberListComponent = ({ users, title }) => {
    if (users.length === 0) {
        return null
    }
    return (
        <div className="member-list-area">
            <p className="title">{title}</p>
            <ListComponent users={users} />
        </div>
    )
}


export default class App extends Component {
    constructor(props) {
        super(props)
        const { community, admin_users, moderator_users, menber_users, guest_users } = props
        assert(is_object(community), "$community must be of type object")
        assert(is_array(admin_users), "$admin_users must be of type array")
        assert(is_array(moderator_users), "$moderator_users must be of type array")
        assert(is_array(menber_users), "$menber_users must be of type array")
        assert(is_array(guest_users), "$guest_users must be of type array")
    }
    render() {
        const { community, logged_in_user, admin_users, moderator_users, menber_users, guest_users,
            platform, device } = this.props
        return (
            <div className="app community-detail">
                <Head title={`ユーザー / ${community.display_name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} device={device} />
                <NavigationbarComponent logged_in_user={logged_in_user} active="members" />
                <div className="client">
                    <div className="inside">
                        <div className="community-detail-component">
                            <div className="inside">
                                <HeaderComponent community={community} active_tab="members" />
                                <MemberListComponent users={admin_users} title="管理者" />
                                <MemberListComponent users={moderator_users} title="モデレーター" />
                                <MemberListComponent users={menber_users} title="メンバー" />
                                <MemberListComponent users={guest_users} title="ゲスト" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}