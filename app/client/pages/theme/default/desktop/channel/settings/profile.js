import classnames from "classnames"
import Head from "../../../../../../views/theme/default/desktop/head"
import NavigationbarComponent from "../../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuComponent from "../../../../../../views/theme/default/desktop/settings/channel/menu"
import BannerComponent from "../../../../../../views/theme/default/desktop/banner/channel"
import config from "../../../../../../beluga.config"
import { request } from "../../../../../../api"
import AppComponent from "../../../../../../views/app"
import Toast from "../../../../../../views/theme/default/desktop/toast"
import { LoadingButton } from "../../../../../../views/theme/default/desktop/button"

export default class App extends AppComponent {
    constructor(props) {
        super(props)
        const { channel } = props
        this.state = {
            "name": channel.name,
            "in_progress": false
        }
    }
    onNameChange = event => {
        const name = event.target.value
        this.setState({ name })
    }
    onUpdate = event => {
        if (this.state.in_progress === true) {
            return
        }
        this.setState({ "in_progress": true })
        setTimeout(() => {
            const { channel, community } = this.props
            request
                .post("/channel/profile/update", {
                    "channel_id": channel.id,
                    "name": this.state.name,
                })
                .then(res => {
                    const { success, error } = res.data
                    if (success == false) {
                        Toast.push(error, false)
                    } else {
                        Toast.push("チャンネル情報を保存しました", true)
                        history.pushState(null, "", `/${community.name}/${this.state.name}/settings/profile`)
                    }
                })
                .catch(error => {
                    Toast.push(error.toString(), false)
                })
                .then(_ => {
                    this.setState({ "in_progress": false })
                })
        }, 250)
    }
    render() {
        const { platform, logged_in_user, community, channel } = this.props
        return (
            <div className="app channel-settings settings">
                <Head title={`情報を編集 / 設定 / ${community.name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} />
                <BannerComponent community={community} channel={channel} />
                <Toast />
                <div className="client">
                    <div className="inside">
                        <div className="settings-menu-area">
                            <SettingsMenuComponent active_page="profile" community={community} channel={channel} />
                        </div>
                        <div className="settings-contents-area">
                            <div className="settings-content-component form profile">
                                <div className="head">
                                    <h1>情報</h1>
                                </div>
                                <div className="item">
                                    <h3 className="title">チャンネル名</h3>
                                    <input className="form-input user-defined-border-color-focus" type="text" onChange={this.onNameChange} value={this.state.name} />
                                </div>
                                <div className="submit">
                                    <LoadingButton
                                        handle_click={this.onUpdate}
                                        is_loading={this.state.in_progress}
                                        label="保存する" />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}