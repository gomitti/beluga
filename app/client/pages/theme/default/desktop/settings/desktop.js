import classnames from "classnames"
import Toggle from "react-toggle"
import { SliderPicker, CirclePicker } from 'react-color'
import enums from "../../../../../enums"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import assign from "../../../../../libs/assign"
import { get as get_desktop_settings } from "../../../../../settings/desktop"
import { is_object } from "../../../../../assert"
import Snackbar from "../../../../../views/theme/default/desktop/snackbar"
import Component from "../../../../../views/app"

export default class App extends Component {
    constructor(props) {
        super(props)
        const { logged_in_user } = props
        const desktop_settings = get_desktop_settings()
        this.state = {
            "color": logged_in_user ? logged_in_user.profile.theme_color : config.default_theme_color,
            "new_column_target": desktop_settings.new_column_target,
            "multiple_columns_enabled": desktop_settings.multiple_columns_enabled
        }
    }
    onUpdate = event => {
        event.preventDefault()
        const settings = assign(get_desktop_settings, {
            "new_column_target": this.state.new_column_target,
            "multiple_columns_enabled": this.state.multiple_columns_enabled,
        })
        request
            .post("/kvs/store", { "key": "desktop_settings", "value": settings })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                }
                Snackbar.show("保存しました", false)
            })
            .catch(error => {
                alert(error)
            })
    }
    render() {
        const { platform, logged_in_user } = this.props
        logged_in_user.profile.theme_color = this.state.color
        return (
            <div id="app" className="settings">
                <Head title={`デスクトップ / 設定 / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationBarView logged_in_user={logged_in_user} is_bottom_hidden={true} />
                <div className="settings-container">
                    <div className="inside">
                        <SettingsMenuView active="desktop" />
                        <div className="settings-container-main">
                            <div className="settings-component form desktop">
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
                                    <button
                                        className={classnames("button user-defined-bg-color", { "in-progress": this.state.pending_change })}
                                        onClick={this.onUpdate}>
                                        <span className="progress-text">保存しています</span>
                                        <span className="display-text">設定を保存</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}