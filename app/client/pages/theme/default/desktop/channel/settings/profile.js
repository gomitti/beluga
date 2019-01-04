import { configure } from "mobx"
import classnames from "classnames"
import Head from "../../../../../../views/theme/default/desktop/head"
import NavigationBarView from "../../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../../views/theme/default/desktop/settings/channel/menu"
import config from "../../../../../../beluga.config"
import { request } from "../../../../../../api"
import Component from "../../../../../../views/app"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    componentDidMount() {
        // stateで管理するのはあまり好きではない
        const { channel } = this.props
        this.refs.name.value = channel.name || ""
    }
    onUpdateProfile = event => {
        const name = this.refs.name.value
        if (this.pending === true) {
            return
        }
        const { server } = this.props
        this.pending = true
        request
            .post("/server/profile/update", {
                "server_id": server.id,
                display_name,
                description,
            })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                } else {
                    alert("保存しました")
                    server.display_name = data.server.display_name
                }
            })
            .catch(error => {
                alert(error)
            })
            .then(_ => {
                this.pending = false
            })
    }
    render() {
        const { platform, logged_in, server, channel } = this.props
        return (
            <div id="app" className="channel-settings settings">
                <Head title={`情報を編集 / 設定 / ${server.name} / ${config.site.name}`} platform={platform} logged_in={logged_in} />
                <NavigationBarView logged_in={logged_in} is_bottom_hidden={true} />
                <div className="settings-content">
                    <div className="inside">
                        <SettingsMenuView active="profile" server={server} channel={channel} />
                        <div className="settings-content-module">
                            <div className="settings-module form profile meiryo">
                                <div className="head">
                                    <h1>情報を編集</h1>
                                </div>

                                <div className="item">
                                    <h3 className="title">チャンネル名</h3>
                                    <input className="form-input user-defined-border-color-focus" type="text" ref="name" />
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