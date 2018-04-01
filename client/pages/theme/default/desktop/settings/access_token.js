import { Component } from "react"
import { configure } from "mobx"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import assert, { is_string } from "../../../../../assert"
import { request } from "../../../../../api"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        const { access_tokens } = props
        this.state = {
            access_tokens
        }
        if (request) {
            request.csrf_token = this.props.csrf_token
        }
        if (typeof history !== "undefined") {
            history.scrollRestoration = "manual"
        }
    }
    onUpdateKey = event => {
        if (this.pending === true) {
            return
        }
        this.pending = true
        request
            .post("/access_token/generate", {})
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    return
                }
                const { token, secret } = data
                assert(is_string(token), "@token must be of type string")
                assert(is_string(secret), "@token must be of type string")
                this.setState({
                    "access_tokens": [
                        { token, secret }
                    ]
                })
            })
            .catch(error => {
                alert(error)
            })
            .then(_ => {
                this.pending = false
            })
    }
    render() {
        const { profile_image_size, platform, logged_in } = this.props
        return (
            <div id="app" className="settings">
                <Head title={`APIキー / 設定 / ${config.site.name}`} platform={platform} logged_in={logged_in} />
                <NavigationBarView logged_in={logged_in} is_bottom_hidden={true} />
                <div className="settings-content">
                    <div className="inside">
                        <SettingsMenuView active="access_token" />
                        <div className="settings-content-module">
                            <div className="settings-module form profile meiryo">
                                <div className="head">
                                    <h1>APIキー</h1>
                                </div>

                                {this.state.access_tokens.length === 0 ? null : (
                                    <div className="item">
                                        <h3 className="title">access_token</h3>
                                        <input readonly className="form-input" type="text" ref="access_token" value={this.state.access_tokens[0].token} onClick={event => {
                                            event.target.select(0, event.target.value.length - 1)
                                        }} />
                                    </div>)}

                                {this.state.access_tokens.length === 0 ? null : (
                                    <div className="item">
                                        <h3 className="title">access_token_secret</h3>
                                        <input readonly className="form-input" type="text" ref="access_token_secret" value={this.state.access_tokens[0].secret} onClick={event => {
                                            event.target.select(0, event.target.value.length - 1)
                                        }} />
                                    </div>
                                )}

                                {this.state.access_tokens.length === 0 ? (
                                    <div className="submit">
                                        <button className="button user-defined-bg-color" onClick={this.onUpdateKey}>キーを追加</button>
                                    </div>
                                ) : (
                                        <div className="submit">
                                            <button className="button user-defined-bg-color" onClick={this.onUpdateKey}>キーを更新</button>
                                        </div>
                                    )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}