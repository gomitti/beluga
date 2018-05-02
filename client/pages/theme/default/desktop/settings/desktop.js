import { Component } from "react"
import classnames from "classnames"
import { SliderPicker, CirclePicker } from 'react-color'
import enums from "../../../../../enums"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import settings, { update as update_settings } from "../../../../../settings/desktop"

export default class App extends Component {
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        const { logged_in } = props
        this.state = {
            "color": logged_in ? logged_in.profile.theme_color : config.default_theme_color,
            "column_target": null	// ここで設定すると正しく表示されないのでhackする
        }
        request.set_csrf_token(this.props.csrf_token)
    }
    componentDidMount() {
        // 謎hack
        this.setState({
            "column_target": settings.column.target
        })
    }
    onUpdate = event => {
        event.preventDefault()
        settings.column.target = this.state.column_target
        update_settings(settings)
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
                                    <h3 className="title">ルームの開き方</h3>
                                    <p><label>
                                        <input
                                            type="radio"
                                            name="column_target"
                                            value="self"
                                            checked={this.state.column_target === enums.column.target.self}
                                            onChange={() => this.setState({ "column_target": enums.column.target.self })} />
                                        現在のタイムラインで開く
									</label></p>
                                    <p><label>
                                        <input
                                            type="radio"
                                            name="column_target"
                                            value="new"
                                            checked={this.state.column_target === enums.column.target.new}
                                            onChange={() => this.setState({ "column_target": enums.column.target.new })} />
                                        一度だけ新しいタイムラインを開き、以降はそのタイムラインで開く
										</label></p>
                                    <p><label>
                                        <input
                                            type="radio"
                                            name="column_target"
                                            value="blank"
                                            checked={this.state.column_target === enums.column.target.blank}
                                            onChange={() => this.setState({ "column_target": enums.column.target.blank })} />
                                        常に新しいタイムラインで開く
										</label></p>
                                </div>
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