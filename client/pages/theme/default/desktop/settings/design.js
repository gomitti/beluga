import { Component } from "react"
import classnames from "classnames"
import { SliderPicker, CirclePicker } from 'react-color'
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"

class ThemeComponent extends Component {
    constructor(props) {
        super(props)
        const { logged_in } = props
        this.state = {
            "color": logged_in ? logged_in.profile.theme_color : config.default_theme_color,
            "pending_change": false,
            "pending_reset": false,
        }
    }
    onColorChangeComplete = (color, event) => {
        this.setState({
            "color": color.hex
        })
        this.props.onUpdate(color.hex)
    }
    onInputChange = (event) => {
        const { hex } = this.refs
        this.setState({
            "color": hex.value
        })
        this.props.onUpdate(hex.value)
    }
    onUpdate = event => {
        if (this.state.pending_change === true) {
            return
        }
        this.setState({
            "pending_change": true
        })
        setTimeout(() => {
            request
                .post("/account/profile/update", {
                    "theme_color": this.state.color
                })
                .then(res => {
                    const { data } = res
                    if (data.success == false) {
                        alert(data.error)
                    }
                })
                .catch(error => {
                    alert(error)
                })
                .then(_ => {
                    this.setState({
                        "pending_change": false
                    })
                })
        }, 500)
    }
    onReset = event => {
        if (this.state.pending_reset === true) {
            return
        }
        this.setState({
            "pending_reset": true
        })
        setTimeout(() => {
            request
                .post("/account/profile/update", {
                    "theme_color": config.default_theme_color
                })
                .then(res => {
                    const { data } = res
                    if (data.success == false) {
                        alert(data.error)
                    } else {
                        this.setState({
                            "color": config.default_theme_color
                        })
                        this.props.onUpdate(config.default_theme_color)
                    }
                })
                .catch(error => {
                    alert(error)
                })
                .then(_ => {
                    this.setState({
                        "pending_reset": false
                    })
                })
        }, 500)
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
                        "#0693e3", "#03a9f4", "#00bcd4", "#8ed1fc", "#009688", "#4caf50", "#8bc34a",
                        "#cddc39", "#00d084", "#7bdcb5", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#ff8a65", "#795548",
                        "#607d8b", "#abb8c3"
                    ]} color={this.state.color} onChangeComplete={this.onColorChangeComplete} />
                </div>
                <div className="picker slider">
                    <SliderPicker color={this.state.color} onChangeComplete={this.onColorChangeComplete} />
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

class BackgroundComponent extends Component {
    constructor(props) {
        super(props)
        const { logged_in } = props
        const background_image = logged_in.profile.use_background_image ? logged_in.profile.background_image : null
        this.state = {
            "file_selected": false,
            "background_image": null,
            "pending_change": false,
            "pending_reset": false,
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
                alert("問題が発生しました。ブラウザを変えると解消する可能性があります。")
                return
            }
            const extension = component[0].replace("data:", "")
            const allowed_extensions = ["image/jpeg", "image/png"]
            if (!(allowed_extensions.includes(extension))) {
                alert("この拡張子には対応していません")
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
            alert("ファイルを選択してください")
        }
        if (this.state.pending_change === true) {
            return
        }
        this.setState({
            "pending_change": true
        })
        request
            .post("/account/profile/background_image/update", {
                "data": this.state.background_image
            })
            .then(res => {
                const { data } = res
                if (data.success == false) {
                    alert(data.error)
                }
            })
            .catch(error => {
                alert(error)
            })
            .then(_ => {
                this.setState({
                    "pending_change": false
                })
            })
    }
    onReset = event => {
        if (this.state.pending_reset === true) {
            return
        }
        this.setState({
            "pending_reset": true
        })
        setTimeout(() => {
            request
                .post("/account/profile/background_image/reset", {})
                .then(res => {
                    const { data } = res
                    if (data.success == false) {
                        alert(data.error)
                    }
                    this.setState({
                        "background_image": null
                    })
                })
                .catch(error => {
                    alert(error)
                }).then(_ => {
                    this.setState({
                        "pending_reset": false
                    })
                })
        }, 500)
    }
    render() {
        return (
            <div className="settings-module background-image">
                <div className="head">
                    <h1>背景画像</h1>
                </div>
                {(() => {
                    const { background_image } = this.state
                    if (background_image) {
                        return (
                            <div className="background-image-wrapper">
                                <a href={background_image} target="_blank">
                                    <img src={background_image} />
                                </a>
                            </div>
                        )
                    }
                })()}
                <input type="file" ref="file" accept="image/*" onChange={this.onFileChange} />
                <div className="submit">
                    {(() => {
                        if (this.state.file_selected) {
                            return (
                                <button
                                    className={classnames("button user-defined-bg-color", { "in-progress": this.state.pending_change })}
                                    onClick={this.onSave}>
                                    <span className="progress-text">保存しています</span>
                                    <span className="display-text">背景画像を保存</span>
                                </button>
                            )
                        }
                    })()}
                    <button
                        className={classnames("button neutral", { "in-progress": this.state.pending_reset })}
                        onClick={this.onReset}>
                        <span className="progress-text">保存しています</span>
                        <span className="display-text">デフォルトに戻す</span>
                    </button>
                </div>
            </div>
        )
    }
}

export default class App extends Component {
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        const { logged_in } = props
        this.state = {
            "color": logged_in ? logged_in.profile.theme_color : config.default_theme_color,
        }
        request.set_csrf_token(this.props.csrf_token)
    }
    onUpdateThemeColor = color => {
        this.setState({ color })
    }
    render() {
        const { platform, logged_in } = this.props
        logged_in.profile.theme_color = this.state.color
        return (
            <div id="app" className="settings">
                <Head title={`デザイン / 設定 / ${config.site.name}`} platform={platform} logged_in={logged_in} />
                <NavigationBarView logged_in={logged_in} is_bottom_hidden={true} />
                <div className="settings-content">
                    <div className="inside">
                        <SettingsMenuView active="design" />
                        <div className="settings-content-module">
                            <ThemeComponent logged_in={logged_in} onUpdate={this.onUpdateThemeColor} />
                            <BackgroundComponent logged_in={logged_in} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}