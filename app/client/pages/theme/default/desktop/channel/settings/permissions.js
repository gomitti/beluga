import { Component } from "react"
import classnames from "classnames"
import Toggle from "react-toggle"
import Head from "../../../../../../views/theme/default/desktop/head"
import NavigationbarComponent from "../../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuComponent from "../../../../../../views/theme/default/desktop/settings/channel/menu"
import BannerComponent from "../../../../../../views/theme/default/desktop/banner/channel"
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
    onChange = () => {
        const checked = this.state.checked
        this.setState({
            "checked": !checked
        })
        if (this.in_progress) {
            return
        }
        this.in_progress = true
        const { channel, permission, role_number } = this.props
        request
            .post("/channel/permissions/update", {
                "channel_id": channel.id,
                "permission": permission,
                "role": role_number,
                "allowed": !checked,
            })
            .then(res => {
                const { success, error } = res.data
                if (success == false) {
                    Toast.push(error, false)
                } else {
                    Toast.push("権限を変更しました", true)
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
        const { label, on_hint, off_hint } = this.props
        if (this.state.checked) {
            return (
                <div className="item">
                    <label className="toggle-button">
                        <Toggle icons={false} defaultChecked={this.state.checked} onChange={this.onChange} />
                        <span className="label">{label}</span>
                    </label>
                    <p className="hint">{on_hint}</p>
                </div>
            )
        }
        return (
            <div className="item">
                <label className="toggle-button">
                    <Toggle defaultChecked={this.state.checked} onChange={this.onChange} />
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
        const { channel, role_label, role_number, permissions } = this.props
        return (
            <div className="role-component">
                <h1 className="title">{role_label}</h1>
                <div className="permission-list">
                    <ToggleComponent
                        label="投稿"
                        channel={channel}
                        role_number={role_number}
                        permission={"update_status"}
                        checked={permissions["update_status"]}
                        on_hint={`${role_label}はこのチャンネルに投稿することができます`}
                        off_hint={`${role_label}はこのチャンネルに投稿できません`} />
                    <ToggleComponent
                        label="いいね"
                        channel={channel}
                        role_number={role_number}
                        permission={"like_status"}
                        checked={permissions["like_status"]}
                        on_hint={`${role_label}はこのチャンネルの投稿にいいねすることができます`}
                        off_hint={`${role_label}はこのチャンネルの投稿にいいねできません`} />
                    <ToggleComponent
                        label="ふぁぼ"
                        channel={channel}
                        role_number={role_number}
                        permission={"favorite_status"}
                        checked={permissions["favorite_status"]}
                        on_hint={`${role_label}はこのチャンネルの投稿をふぁぼることができます`}
                        off_hint={`${role_label}はこのチャンネルの投稿をふぁぼれません`} />
                    <ToggleComponent
                        label="リアクション"
                        channel={channel}
                        role_number={role_number}
                        permission={"add_reaction_to_status"}
                        checked={permissions["add_reaction_to_status"]}
                        on_hint={`${role_label}はこのチャンネルの投稿にリアクションすることができます`}
                        off_hint={`${role_label}はこのチャンネルの投稿にリアクションできません`} />
                    <ToggleComponent
                        label="コメント"
                        channel={channel}
                        role_number={role_number}
                        permission={"comment_on_status"}
                        checked={permissions["comment_on_status"]}
                        on_hint={`${role_label}はこのチャンネルの投稿にコメントすることができます`}
                        off_hint={`${role_label}はこのチャンネルの投稿にコメントできません`} />
                </div>
            </div>
        )
    }
}

export default class App extends AppComponent {
    render() {
        const { platform, logged_in_user, community, channel, map_role_number, permissions } = this.props
        const role_admin = map_role_number["admin"]
        const role_moderator = map_role_number["moderator"]
        const role_member = map_role_number["member"]
        const role_guest = map_role_number["guest"]
        return (
            <div className="app settings channel-settings">
                <Head title={`役職の権限 / 設定 / ${community.name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} />
                <BannerComponent community={community} channel={channel} />
                <Toast />
                <div className="client">
                    <div className="inside">
                        <div className="settings-menu-area">
                            <SettingsMenuComponent active_page="permissions" community={community} channel={channel} />
                        </div>
                        <div className="settings-contents-area">
                            <div className="settings-content-component channel-permissions meiryo">
                                <div className="head">
                                    <h1>役職の権限</h1>
                                </div>
                                <div className="role-component-area">
                                    <RoleComponent channel={channel} role_label="管理者" role_number={role_admin} permissions={permissions[role_admin]} />
                                    <RoleComponent channel={channel} role_label="モデレーター" role_number={role_moderator} permissions={permissions[role_moderator]} />
                                    <RoleComponent channel={channel} role_label="メンバー" role_number={role_member} permissions={permissions[role_member]} />
                                    <RoleComponent channel={channel} role_label="ゲスト" role_number={role_guest} permissions={permissions[role_guest]} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}