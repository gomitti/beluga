import { Component } from "react"
import { configure } from "mobx"
import classnames from "classnames"
import Head from "../../../../../../views/theme/default/desktop/head"
import NavigationBarView from "../../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../../views/theme/default/desktop/settings/channel/menu"
import config from "../../../../../../beluga.config"
import { request } from "../../../../../../api"
import AppComponent from "../../../../../../views/app"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

class AttributeComponent extends Component {
    constructor(props) {
        super(props)
        const { logged_in } = props
        this.state = {
            "pending_update": false,
        }
    }
    render() {
        return (
            <div className="settings-module color-pickers">
                <div className="head">
                    <h1>テーマカラー</h1>
                </div>
                <div className="picker">
                    <CirclePicker width="380px" colors={[
                        "#f78da7", "#f47373", "#f44336", "#e91e63", "#ba68c8", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3",
                        "#0693e3", "#03a9f4", "#00bcd4", "#8bceef", "#009688", "#4caf50", "#8bc34a",
                        "#cddc39", "#00d084", "#7bdcb5", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#ff8a65", "#795548",
                        "#607d8b", "#abb8c3"
                    ]} color={this.state.color} onChangeComplete={this.onColorChangeComplete} />
                </div>
                <div className="picker input">
                    <input className="input" value={this.state.color} style={{
                        "borderBottomColor": this.state.color
                    }} onChange={this.onInputChange} ref="hex" />
                </div>
                <div className="submit">
                    <button
                        className={classnames("button user-defined-bg-color", { "in-progress": this.state.pending_change })}
                        onClick={this.onUpdate}>
                        <span className="progress-text">保存しています</span>
                        <span className="display-text">テーマカラーを保存</span>
                    </button>
                    <button
                        className={classnames("button neutral user-defined-bg-color", { "in-progress": this.state.pending_reset })}
                        onClick={this.onReset}>
                        <span className="progress-text">保存しています</span>
                        <span className="display-text">デフォルトに戻す</span>
                    </button>
                </div>
            </div>
        )
    }
}

export default class App extends AppComponent {
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
                        <SettingsMenuView active="access_control" server={server} channel={channel} />
                        <div className="settings-content-module">
                            <div className="settings-module form profile meiryo">
                                <div className="head">
                                    <h1>アクセスコントロール</h1>
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