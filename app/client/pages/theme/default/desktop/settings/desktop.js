import { Component } from "react"
import classnames from "classnames"
import Toggle from "react-toggle"
import Router from "next/router"
import { SliderPicker, CirclePicker } from 'react-color'
import enums from "../../../../../enums"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import assign from "../../../../../libs/assign"
import { default_settings } from "../../../../../settings/desktop"
import { is_object } from "../../../../../assert"
import Snackbar from "../../../../../views/theme/default/desktop/snackbar"

export default class App extends Component {
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        const { logged_in, settings } = props
        const _settings = assign(default_settings, settings)
        this.state = {
            "color": logged_in ? logged_in.profile.theme_color : config.default_theme_color,
            "new_column_target": _settings.new_column_target,
            "multiple_columns_enabled": _settings.multiple_columns_enabled
        }
        request.set_csrf_token(this.props.csrf_token)

        // Safariのブラウザバック問題の解消
        if (typeof window !== "undefined") {
            Router.beforePopState(({ url, as, options }) => {
                return false
            });

        }
    }
    onUpdate = event => {
        event.preventDefault()
        const settings = assign(default_settings, {
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
        const { platform, logged_in } = this.props
        logged_in.profile.theme_color = this.state.color
        return (
            <div id="app" className="settings">
                <Head title={`デスクトップ / 設定 / ${config.site.name}`} platform={platform} logged_in={logged_in} />
                <NavigationBarView logged_in={logged_in} is_bottom_hidden={true} />
                <div className="settings-content">
                    <div className="inside">
                        <SettingsMenuView active="desktop" />
                        <div className="settings-content-module">
                            <div className="settings-module form desktop">
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
                                        <h3 className="title">ルームの開き方</h3>
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