import { Component } from "react"
import classnames from "classnames"
import Head from "../../../../../../views/theme/default/desktop/head"
import NavigationbarComponent from "../../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuComponent from "../../../../../../views/theme/default/desktop/settings/community/menu"
import BannerComponent from "../../../../../../views/theme/default/desktop/banner/community"
import config from "../../../../../../beluga.config"
import { request } from "../../../../../../api"
import AppComponent from "../../../../../../views/app"
import Toast from "../../../../../../views/theme/default/desktop/toast"
import { LoadingButton } from "../../../../../../views/theme/default/desktop/button"

const RoleComponent = ({ title, users, handle_update, map_role_number }) => {
    if (users.length === 0) {
        return null
    }
    const role_strings = ["ゲスト", "メンバー", "モデレーター", "管理者"]
    const views = []
    users.forEach(user => {
        const display_name = (user.display_name && user.display_name.length > 0) ? user.display_name : user.name
        const role_str = role_strings[user.role]
        views.push(
            <div className="user">
                <a className="label-area" href={`/user/${user.name}`}>
                    <img className="avatar" src={user.avatar_url} />
                    <span className="display-name meiryo">{display_name}</span>
                    <span className="name verdana">{user.name}</span>
                </a>
                <div className="menu-area">
                    <div className="dropdown-menu">
                        <span className="label">{role_str}</span>
                        <span className="icon"></span>
                        <div className="dropdown-component">
                            <div className="inside">
                                <ul className="menu">
                                    <a className="item user-defined-bg-color-hover" onClick={event => {
                                        event.preventDefault()
                                        handle_update(user.id, map_role_number["moderator"])
                                    }}>モデレーター</a>
                                    <a className="item user-defined-bg-color-hover" onClick={event => {
                                        event.preventDefault()
                                        handle_update(user.id, map_role_number["member"])
                                    }}>メンバー</a>
                                    <a className="item user-defined-bg-color-hover" onClick={event => {
                                        event.preventDefault()
                                        handle_update(user.id, map_role_number["guest"])
                                    }}>ゲスト</a>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    })
    return (
        <div className="role-component">
            <h1 className="title">{title}</h1>
            <div className="user-list">
                {views}
            </div>
        </div>
    )
}

class MemberListComponent extends Component {
    constructor(props) {
        super(props)
        const { members, map_role_number } = this.props
        const admin_users = []
        const moderator_users = []
        const menber_users = []
        const guest_users = []
        members.forEach(user => {
            if (user.role === map_role_number["admin"]) {
                return admin_users.push(user)
            }
            if (user.role === map_role_number["moderator"]) {
                return moderator_users.push(user)
            }
            if (user.role === map_role_number["member"]) {
                return menber_users.push(user)
            }
            if (user.role === map_role_number["guest"]) {
                return guest_users.push(user)
            }
        })
        this.state = this.generateMembersList()
    }
    generateMembersList = () => {
        const { members, map_role_number } = this.props
        const admin_users = []
        const moderator_users = []
        const menber_users = []
        const guest_users = []
        members.forEach(user => {
            if (user.role === map_role_number["admin"]) {
                return admin_users.push(user)
            }
            if (user.role === map_role_number["moderator"]) {
                return moderator_users.push(user)
            }
            if (user.role === map_role_number["member"]) {
                return menber_users.push(user)
            }
            if (user.role === map_role_number["guest"]) {
                return guest_users.push(user)
            }
        })
        return { admin_users, moderator_users, menber_users, guest_users }
    }
    updateRole = (user_id, new_role_number) => {
        if (this.in_progress === true) {
            return
        }
        this.in_progress = true
        const { community } = this.props
        request
            .post("/user/role/update", {
                "community_id": community.id,
                "user_id": user_id,
                "role": new_role_number
            })
            .then(res => {
                const data = res.data
                const { error, success } = data
                if (success == false) {
                    Toast.push(error, false)
                } else {
                    const { members } = this.props
                    members.forEach(user => {
                        if (user.id === user_id) {
                            user.role = new_role_number
                        }
                    })
                    const { admin_users, moderator_users, menber_users, guest_users } = this.generateMembersList()
                    this.setState({ admin_users, moderator_users, menber_users, guest_users })
                    Toast.push("役職を変更しました", true)
                }
            })
            .catch(error => {
                Toast.push(error.toString(), false)
            })
            .then(_ => {
                this.in_progress = false
            })
    }
    render() {
        const { map_role_number } = this.props
        return (
            <div className="settings-content-component form community-role meiryo">
                <div className="head">
                    <h1>役職</h1>
                </div>
                <RoleComponent title="管理者" users={this.state.admin_users} map_role_number={map_role_number} handle_update={this.updateRole} />
                <RoleComponent title="モデレーター" users={this.state.moderator_users} map_role_number={map_role_number} handle_update={this.updateRole} />
                <RoleComponent title="メンバー" users={this.state.menber_users} map_role_number={map_role_number} handle_update={this.updateRole} />
                <RoleComponent title="ゲスト" users={this.state.guest_users} map_role_number={map_role_number} handle_update={this.updateRole} />
            </div>
        )
    }
}

export default class App extends AppComponent {
    render() {
        const { profile_image_size, platform, logged_in_user, community, members, map_role_number } = this.props
        return (
            <div className="app community-settings settings">
                <Head title={`役職 / 設定 / ${community.name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} is_bottom_hidden={true} />
                <BannerComponent title="設定" community={community} />
                <Toast />
                <div className="client">
                    <div className="inside">
                        <div className="settings-menu-area">
                            <SettingsMenuComponent active_page="role" community={community} />
                        </div>
                        <div className="settings-contents-area">
                            <MemberListComponent members={members} map_role_number={map_role_number} community={community} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}