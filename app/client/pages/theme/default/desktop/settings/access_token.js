import Head from "../../../../../views/theme/default/desktop/head"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuComponent from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import assert, { is_string, is_object } from "../../../../../assert"
import { request } from "../../../../../api"
import AppComponent from "../../../../../views/app"
import Toast from "../../../../../views/theme/default/desktop/toast"
import { LoadingButton } from "../../../../../views/theme/default/desktop/button"

const select_text = event => {
    event.target.select(0, event.target.value.length - 1)
}
const TokenComponentOrNull = ({ is_hidden, title, value, handle_click }) => {
    if (is_hidden) {
        return null
    }
    return (
        <div className="item">
            <h3 className="title">{title}</h3>
            <input readonly className="form-input" type="text" value={value} onClick={handle_click} />
        </div>
    )
}

export default class App extends AppComponent {
    constructor(props) {
        super(props)
        const { access_tokens } = props
        this.state = {
            "access_tokens": access_tokens,
            "in_progress": false
        }
    }
    update = event => {
        if (this.state.in_progress === true) {
            return
        }
        this.setState({ "in_progress": true })
        setTimeout(() => {
            request
                .post("/access_token/generate", {})
                .then(res => {
                    const { success, error, token, secret } = res.data
                    if (success == false) {
                        Toast.push(error, false)
                    } else {
                        this.setState({
                            "access_tokens": [
                                { token, secret }
                            ]
                        })
                        Toast.push("トークンを生成しました", true)
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
        const { profile_image_size, platform, logged_in_user } = this.props
        const no_token = this.state.access_tokens.length === 0
        const access_token = this.state.access_tokens.length === 0 ? null : this.state.access_tokens[0].token
        const access_token_secret = this.state.access_tokens.length === 0 ? null : this.state.access_tokens[0].secret
        return (
            <div className="app settings">
                <Head title={`アクセストークン / 設定 / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} is_bottom_hidden={true} />
                <Toast />
                <div className="client">
                    <div className="inside">
                        <div className="settings-menu-area">
                            <SettingsMenuComponent active_page="access_token" />
                        </div>
                        <div className="settings-contents-area">
                            <div className="settings-content-component form profile">
                                <div className="head">
                                    <h1>アクセストークン</h1>
                                </div>
                                <TokenComponentOrNull
                                    is_hidden={no_token}
                                    title="access_token"
                                    handle_click={select_text}
                                    value={access_token} />
                                <TokenComponentOrNull
                                    is_hidden={no_token}
                                    title="access_token_secret"
                                    handle_click={select_text}
                                    value={access_token_secret} />
                                <div className="submit">
                                    <LoadingButton
                                        is_loading={this.state.in_progress}
                                        handle_click={this.update}
                                        label={this.state.access_tokens.length === 0 ? "トークンを追加" : "トークンを更新"} />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}