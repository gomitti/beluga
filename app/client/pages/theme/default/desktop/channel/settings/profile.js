import { configure } from "mobx"
import classnames from "classnames"
import Head from "../../../../../../views/theme/default/desktop/head"
import NavigationBarView from "../../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../../views/theme/default/desktop/settings/channel/menu"
import config from "../../../../../../beluga.config"
import { request } from "../../../../../../api"
import Component from "../../../../../../views/app"
import Snackbar from "../../../../../../views/theme/default/desktop/snackbar"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    constructor(props) {
        super(props)
        const { channel } = props
        this.state = {
            "name": channel.name,
        }
    }
    onNameChange = event => {
        const name = event.target.value
        this.setState({ name })
    }
    onUpdateProfile = event => {
        if (this.pending === true) {
            return
        }
        const { channel, server } = this.props
        this.pending = true
        request
            .post("/channel/profile/update", {
                "channel_id": channel.id,
                "name": this.state.name,
            })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    return
                }
                history.pushState(null, "", `/server/${server.name}/${this.state.name}/settings/profile`)
                Snackbar.show("保存しました")
            })
            .catch(error => {
                alert(error)
            })
            .then(_ => {
                this.pending = false
            })
    }
    render() {
        const { platform, logged_in_user, server, channel } = this.props
        return (
            <div id="app" className="channel-settings settings">
                <Head title={`情報を編集 / 設定 / ${server.name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationBarView logged_in_user={logged_in_user} is_bottom_hidden={true} />
                <div className="settings-container">
                    <div className="inside">
                        <SettingsMenuView active="profile" server={server} channel={channel} />
                        <div className="settings-container-main">
                            <div className="settings-component form profile meiryo">
                                <div className="head">
                                    <h1>情報を編集</h1>
                                </div>

                                <div className="item">
                                    <h3 className="title">チャンネル名</h3>
                                    <input className="form-input user-defined-border-color-focus" type="text" onChange={this.onNameChange} value={this.state.name} />
                                </div>

                                <div className="submit">
                                    <button className="button user-defined-bg-color" onClick={this.onUpdateProfile}>変更を保存</button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}