import classnames from "classnames"
import { SliderPicker, CirclePicker } from 'react-color'
import enums from "../../../../../enums"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuComponent from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import assign from "../../../../../libs/assign"
import { get as get_desktop_settings } from "../../../../../settings/desktop"
import { is_object } from "../../../../../assert"
import Component from "../../../../../views/app"
import Toast from "../../../../../views/theme/default/desktop/toast"
import { LoadingButton } from "../../../../../views/theme/default/desktop/button"

export default class App extends Component {
    constructor(props) {
        super(props)
        const { logged_in_user } = props
        const desktop_settings = get_desktop_settings()
        this.state = {
            "color": logged_in_user ? logged_in_user.profile.theme_color : config.default_theme_color,
            "new_column_target": desktop_settings.new_column_target,
            "multiple_columns_enabled": desktop_settings.multiple_columns_enabled,
            "in_progress": false
        }
    }
    onUpdate = event => {
        event.preventDefault()
        if (this.state.in_progress) {
            return
        }
        this.setState({ "in_progress": true })
        setTimeout(() => {
            const settings = assign(get_desktop_settings(), {
                "new_column_target": this.state.new_column_target,
                "multiple_columns_enabled": this.state.multiple_columns_enabled,
            })
            request
                .post("/kvs/store", { "key": "desktop_settings", "value": settings })
                .then(res => {
                    const { success, error } = res.data
                    if (success == false) {
                        Toast.push(error, false)
                    } else {
                        Toast.push("設定を保存しました", true)
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
        const { platform, logged_in_user } = this.props
        logged_in_user.profile.theme_color = this.state.color
        return (
            <div className="app settings">
                <Head title={`デスクトップ / 設定 / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} is_bottom_hidden={true} />
                <Toast />
                <div className="client">
                    <div className="inside">
                        <div className="settings-menu-area">
                            <SettingsMenuComponent active_page="desktop" />
                        </div>
                        <div className="settings-contents-area">
                            <div className="settings-content-component form desktop">
                                <div className="head">
                                    <h1>デスクトップ</h1>
                                </div>
                                <div className="item">
                                    <h3 className="title">マルチカラム</h3>
                                    <p><label>
                                        <input type="checkbox"
                                            name="multiple_columns_enabled"
                                            checked={this.state.multiple_columns_enabled}
                                            onChange={() => this.setState({ "multiple_columns_enabled": !this.state.multiple_columns_enabled })} />
                                        マルチカラムを有効にする
									</label></p>
                                </div>
                                {this.state.multiple_columns_enabled ?
                                    <div className="item">
                                        <h3 className="title">チャンネルの開き方</h3>
                                        <p><label>
                                            <input
                                                type="radio"
                                                name="new_column_target"
                                                value="new"
                                                checked={this.state.new_column_target === enums.column.target.new}
                                                onChange={() => this.setState({ "new_column_target": enums.column.target.new })} />
                                            一度だけ新しいカラムを開き、以降はそのカラムで開く
                                            </label></p>
                                        <p><label>
                                            <input
                                                type="radio"
                                                name="new_column_target"
                                                value="blank"
                                                checked={this.state.new_column_target === enums.column.target.blank}
                                                onChange={() => this.setState({ "new_column_target": enums.column.target.blank })} />
                                            常に新しいカラムで開く
                                            </label></p>
                                    </div>
                                    : null
                                }
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