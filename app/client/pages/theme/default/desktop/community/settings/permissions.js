import { Component } from "react"
import classnames from "classnames"
import Toggle from "react-toggle"
import Head from "../../../../../../views/theme/default/desktop/head"
import NavigationbarComponent from "../../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuComponent from "../../../../../../views/theme/default/desktop/settings/community/menu"
import BannerComponent from "../../../../../../views/theme/default/desktop/banner/community"
import config from "../../../../../../beluga.config"
import { request } from "../../../../../../api"
import AppComponent from "../../../../../../views/app"
import Toast from "../../../../../../views/theme/default/desktop/toast"
import { LoadingButton } from "../../../../../../views/theme/default/desktop/button"

class ToggleComponent extends Component {
    constructor(props) {
        super(props)
        const { checked } = props
        this.state = { checked }
    }
    onChange = async () => {
        const checked = this.state.checked
        this.setState({
            "checked": !checked
        })
        if (this.in_progress) {
            return
        }
        this.in_progress = true
        try {
            const { community, permission, role_number } = this.props
            const res = await request.post("/community/permissions/update", {
                "community_id": community.id,
                "permission": permission,
                "role": role_number,
                "allowed": !checked,
            })
            const { success, error } = res.data
            if (success == false) {
                throw new Error(error)
            }
            Toast.push("権限を変更しました", true)
        } catch (error) {
            Toast.push(error.toString(), false)
            this.setState({
                "checked": checked
            })
        }
        this.in_progress = false
    }
    render() {
        const { label, on_hint, off_hint } = this.props
        if (this.state.checked) {
            return (
                <div className="item">
                    <label className="toggle-button">
                        <Toggle icons={false} checked={this.state.checked} defaultChecked={this.state.checked} onChange={this.onChange} />
                        <span className="label">{label}</span>
                    </label>
                    <p className="hint">{on_hint}</p>
                </div>
            )
        }
        return (
            <div className="item">
                <label className="toggle-button">
                    <Toggle checked={this.state.checked} defaultChecked={this.state.checked} onChange={this.onChange} />
                    <span className="label">{label}</span>
                </label>
                <p className="hint">{off_hint}</p>
            </div>
        )
    }
}

class RoleComponent extends Component {
    constructor(props) {
        super(props)
    }
    render() {
        const { community, role_label, role_number, permissions } = this.props
        return (
            <div className="role-component">
                <h1 className="title">{role_label}</h1>
                <div className="permission-list">
                    <ToggleComponent
                        label="チャンネルの作成"
                        community={community}
                        role_number={role_number}
                        permission={"create_channel"}
                        checked={permissions["create_channel"]}
                        on_hint={`${role_label}はチャンネルを作成することができます`}
                        off_hint={`${role_label}はチャンネルを作成できません`} />
                    <ToggleComponent
                        label="絵文字の追加"
                        community={community}
                        role_number={role_number}
                        permission={"add_emoji"}
                        checked={permissions["add_emoji"]}
                        on_hint={`${role_label}は絵文字を追加することができます`}
                        off_hint={`${role_label}は絵文字を追加できません`} />
                </div>
            </div>
        )
    }
}

export default class App extends AppComponent {
    render() {
        const { platform, logged_in_user, community, map_role_number, permissions } = this.props
        const role_admin = map_role_number["admin"]
        const role_moderator = map_role_number["moderator"]
        const role_member = map_role_number["member"]
        const role_guest = map_role_number["guest"]
        return (
            <div className="app settings community-settings">
                <Head title={`役職の権限 / 設定 / ${community.name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} />
                <BannerComponent title="設定" community={community} />
                <Toast />
                <div className="client">
                    <div className="inside">
                        <div className="settings-menu-area">
                            <SettingsMenuComponent active_page="permissions" community={community} />
                        </div>
                        <div className="settings-contents-area">
                            <div className="settings-content-component channel-permissions">
                                <div className="head">
                                    <h1>役職の権限</h1>
                                </div>
                                <div className="role-component-area">
                                    <RoleComponent community={community} role_label="管理者" role_number={role_admin} permissions={permissions[role_admin]} />
                                    <RoleComponent community={community} role_label="モデレーター" role_number={role_moderator} permissions={permissions[role_moderator]} />
                                    <RoleComponent community={community} role_label="メンバー" role_number={role_member} permissions={permissions[role_member]} />
                                    <RoleComponent community={community} role_label="ゲスト" role_number={role_guest} permissions={permissions[role_guest]} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}