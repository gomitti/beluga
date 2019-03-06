import { Component } from "react"
import classnames from "classnames"
import { SliderPicker, CirclePicker } from 'react-color'
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuComponent from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import { is_object } from "../../../../../assert"
import AppComponent from "../../../../../views/app"
import Toast from "../../../../../views/theme/default/desktop/toast"
import { LoadingButton } from "../../../../../views/theme/default/desktop/button"

const LoadingButtonOrNull = ({ is_hidden, handle_click, is_loading, label, is_neutral_color }) => {
    if (is_hidden) {
        return null
    }
    return (
        <LoadingButton
            handle_click={handle_click}
            is_loading={is_loading}
            is_neutral_color={is_neutral_color}
            label={label} />
    )
}

class ThemeComponent extends Component {
    constructor(props) {
        super(props)
        const { logged_in_user } = props
        const color = logged_in_user ? logged_in_user.profile.theme_color : config.default_theme_color
        logged_in_user.profile.theme_color = color
        this.state = {
            "color": color,
            "change_in_progress": false,
            "reset_in_progress": false,
        }
        this.colors = [
            "#f78da7", "#f47373", "#f44336", "#e91e63", "#ba68c8", "#9c27b0", "#673ab7",
            "#3f51b5", "#2196f3", "#0693e3", "#03a9f4", "#00bcd4", "#8bceef", "#009688",
            "#4caf50", "#8bc34a", "#cddc39", "#00d084", "#7bdcb5", "#ffeb3b", "#ffc107",
            "#ff9800", "#ff5722", "#ff8a65", "#795548", "#607d8b", "#abb8c3"
        ]
    }
    onColorChangeComplete = (color, event) => {
        this.setState({
            "color": color.hex
        })
        const { callback_update } = this.props
        callback_update(color.hex)
    }
    onInputChange = (event) => {
        const { hex } = this.refs
        const { callback_update } = this.props
        this.setState({
            "color": hex.value
        })
        callback_update(hex.value)
    }
    onUpdate = event => {
        if (this.state.change_in_progress === true) {
            return
        }
        this.setState({ "change_in_progress": true })
        setTimeout(() => {
            request
                .post("/account/profile/update", {
                    "theme_color": this.state.color
                })
                .then(res => {
                    const { data } = res
                    const { success, error } = data
                    if (success == false) {
                        Toast.push(error, false)
                    } else {
                        Toast.push("テーマカラーを保存しました", true)
                    }
                })
                .catch(error => {
                    Toast.push(error.toString(), false)
                })
                .then(_ => {
                    this.setState({ "change_in_progress": false })
                })
        }, 250)
    }
    onReset = event => {
        if (this.state.reset_in_progress === true) {
            return
        }
        this.setState({ "reset_in_progress": true })
        setTimeout(() => {
            request
                .post("/account/profile/update", {
                    "theme_color": config.default_theme_color
                })
                .then(res => {
                    const { data } = res
                    const { success, error } = data
                    if (success == false) {
                        Toast.push(error, false)
                    } else {
                        this.setState({
                            "color": config.default_theme_color
                        })
                        const { callback_update } = this.props
                        callback_update(config.default_theme_color)
                        Toast.push("デフォルトのテーマカラーに戻しました", true)
                    }
                })
                .catch(error => {
                    Toast.push(error.toString(), false)
                })
                .then(_ => {
                    this.setState({ "reset_in_progress": false })
                })
        }, 250)
    }
    render() {
        return (
            <div className="settings-content-component color-pickers">
                <div className="head">
                    <h1>テーマカラー</h1>
                </div>
                <div className="picker">
                    <CirclePicker width="380px" colors={this.colors} color={this.state.color} onChangeComplete={this.onColorChangeComplete} />
                </div>
                <div className="picker input">
                    <input className="input" value={this.state.color} style={{
                        "borderBottomColor": this.state.color
                    }} onChange={this.onInputChange} ref="hex" />
                </div>
                <div className="submit">
                    <LoadingButtonOrNull
                        handle_click={this.onUpdate}
                        is_loading={this.state.change_in_progress}
                        label="保存する" />
                    <LoadingButtonOrNull
                        handle_click={this.onReset}
                        is_loading={this.state.reset_in_progress}
                        is_neutral_color={true}
                        label="デフォルトに戻す" />
                </div>
            </div>
        )
    }
}

const BackgroundImageAreaOrNull = ({ is_hidden, background_image }) => {
    if (is_hidden) {
        return null
    }
    return (
        <div className="background-image-area">
            <a className="link" href={background_image} target="_blank">
                <img className="image" src={background_image} />
            </a>
        </div>
    )
}

class BackgroundComponent extends Component {
    constructor(props) {
        super(props)
        const { logged_in_user } = props
        const background_image = logged_in_user.profile.use_background_image ? logged_in_user.profile.background_image : null
        this.state = {
            "file_selected": false,
            "background_image": null,
            "change_in_progress": false,
            "reset_in_progress": false,
            background_image
        }
    }
    onFileChange = event => {
        const files = event.target.files
        if (files.length !== 1) {
            return
        }
        const file = files[0]
        const reader = new FileReader()
        reader.onload = event => {
            const base64 = reader.result
            const component = base64.split(";")
            if (component.length !== 2) {
                Toast.push("問題が発生しました。ブラウザを変えると解消する可能性があります。", false)
                return
            }
            const extension = component[0].replace("data:", "")
            const allowed_extensions = ["image/jpeg", "image/png"]
            if (!(allowed_extensions.includes(extension))) {
                Toast.push("この拡張子には対応していません", false)
                return
            }
            this.setState({
                "file_selected": true,
                "background_image": base64
            })
        }
        reader.readAsDataURL(file)
    }
    onSave = event => {
        if (!!this.state.background_image === false) {
            Toast.push("ファイルを選択してください", false)
        }
        if (this.state.change_in_progress === true) {
            return
        }
        this.setState({ "change_in_progress": true })
        request
            .post("/account/profile/background_image/update", {
                "data": this.state.background_image
            })
            .then(res => {
                const { success, error } = res.data
                if (success == false) {
                    Toast.push(error, false)
                } else {
                    Toast.push("背景画像を保存しました", true)
                }
            })
            .catch(error => {
                Toast.push(error.toString(), false)
            })
            .then(_ => {
                this.setState({ "change_in_progress": false })
            })
    }
    onReset = event => {
        if (this.state.reset_in_progress === true) {
            return
        }
        this.setState({ "reset_in_progress": true })
        setTimeout(() => {
            request
                .post("/account/profile/background_image/reset", {})
                .then(res => {
                    const { success, error } = res.data
                    if (success == false) {
                        Toast.push(error, false)
                    } else {
                        Toast.push("背景画像をデフォルトに戻しました", true)
                        this.setState({
                            "background_image": null
                        })
                    }
                })
                .catch(error => {
                    Toast.push(error.toString(), false)
                }).then(_ => {
                    this.setState({ "reset_in_progress": false })
                })
        }, 250)
    }
    render() {
        const { background_image } = this.state
        return (
            <div className="settings-content-component background-image">
                <div className="head">
                    <h1>背景画像</h1>
                </div>
                <BackgroundImageAreaOrNull
                    is_hidden={background_image === null}
                    background_image={background_image} />
                <input type="file" ref="file" accept="image/*" onChange={this.onFileChange} />
                <div className="submit">
                    <LoadingButtonOrNull
                        is_hidden={!this.state.file_selected}
                        handle_click={this.onSave}
                        is_loading={this.state.change_in_progress}
                        label="保存する" />
                    <LoadingButtonOrNull
                        handle_click={this.onReset}
                        is_loading={this.state.reset_in_progress}
                        is_neutral_color={true}
                        label="デフォルトに戻す" />
                </div>
            </div>
        )
    }
}

export default class App extends AppComponent {
    onUpdateThemeColor = color => {
        const { logged_in_user } = this.props
        logged_in_user.profile.theme_color = color
        this.forceUpdate()
    }
    render() {
        const { platform, logged_in_user } = this.props
        return (
            <div className="app settings">
                <Head title={`デザイン / 設定 / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} is_bottom_hidden={true} />
                <Toast />
                <div className="client">
                    <div className="inside">
                        <div className="settings-menu-area">
                            <SettingsMenuComponent active_page="design" />
                        </div>
                        <div className="settings-contents-area">
                            <ThemeComponent logged_in_user={logged_in_user} callback_update={this.onUpdateThemeColor} />
                            <BackgroundComponent logged_in_user={logged_in_user} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}