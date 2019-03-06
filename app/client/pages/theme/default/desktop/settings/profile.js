import { Component } from "react"
import classnames from "classnames"
import ReactCrop, { makeAspectCrop } from "react-image-crop"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuComponent from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import { get_category_by_shortname_or_null, get_image_url_by_shortname_or_null, EmojiPickerStore } from "../../../../../stores/theme/default/common/emoji"
import assert, { is_object } from "../../../../../assert"
import EmojiPicker from "../../../../../views/theme/default/desktop/emoji"
import AppComponent from "../../../../../views/app"
import Toast from "../../../../../views/theme/default/desktop/toast"
import { LoadingButton } from "../../../../../views/theme/default/desktop/button"

class ProfileComponent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "in_progress": false
        }
    }
    componentDidMount() {
        const { logged_in_user } = this.props
        this.refs.display_name.value = logged_in_user.display_name || ""
        this.refs.description.value = logged_in_user.profile.description || ""
        this.refs.location.value = logged_in_user.profile.location || ""
    }
    onUpdate = event => {
        event.preventDefault()
        const display_name = this.refs.display_name.value
        const description = this.refs.description.value
        const location = this.refs.location.value
        const { status } = this.refs
        if (this.state.in_progress === true) {
            return
        }
        this.setState({ "in_progress": true })
        const params = {
            display_name,
            description,
            location
        }
        const { selected_emoji, text } = status.state
        if (selected_emoji) {
            const { shortname } = selected_emoji
            params.status_emoji_shortname = shortname
            params.status_text = text
        }
        setTimeout(() => {
            request
                .post("/account/profile/update", params)
                .then(res => {
                    const { success, error } = res.data
                    if (success == false) {
                        Toast.push(error, false)
                    } else {
                        Toast.push("プロフィールを保存しました", true)
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
        const { logged_in_user } = this.props
        return (
            <div className="settings-content-component form profile meiryo">
                <div className="head">
                    <h1>プロフィール</h1>
                </div>
                <div className="item">
                    <h3 className="title">ユーザー名</h3>
                    <input className="form-input user-defined-border-color-focus" type="text" ref="display_name" />
                    <p className="hint">日本語が使えます。</p>
                </div>
                <div className="item">
                    <h3 className="title">自己紹介</h3>
                    <textarea className="form-input user-defined-border-color-focus" ref="description"></textarea>
                </div>
                <UserStatusComponent ref="status" logged_in_user={logged_in_user} />
                <div className="item">
                    <h3 className="title">場所</h3>
                    <input className="form-input user-defined-border-color-focus" type="text" ref="location" />
                </div>
                <div className="submit">
                    <LoadingButton
                        handle_click={this.onUpdate}
                        is_loading={this.state.in_progress}
                        label="プロフィールを保存" />
                </div>
            </div>
        )
    }
}

const SubmitAreaComponentOrNull = ({ is_hidden, in_progress, handle_click, label, is_neutral_color }) => {
    if (is_hidden) {
        return null
    }
    return (
        <div className="submit">
            <LoadingButton
                handle_click={handle_click}
                is_loading={in_progress}
                is_neutral_color={is_neutral_color}
                label={label} />
        </div>
    )
}

const CropComponent = ({ crop_state, image_size, callback_load, callback_complete, callback_change }) => {
    if (typeof window === "undefined") {
        return null
    }
    return (
        <ReactCrop
            {...crop_state}
            profile_image_size={image_size}
            onImageLoaded={callback_load}
            onComplete={callback_complete}
            onChange={callback_change}
        />
    )
}

class AvatarComponent extends Component {
    constructor(props) {
        super(props)
        const { logged_in_user } = props
        this.state = {
            "crop": {
                x: 0,
                y: 0,
            },
            "maxHeight": 100,
            "shape": {
                width: -1,
                height: -1
            },
            "src": null,
            "extension": null,
            "preview_src": logged_in_user.avatar_url,
            "is_crop_ready": false,
            "update_in_progress": false,
            "reset_in_progress": false,
            "update_in_progress": false,
            "reset_in_progress": false,
        }
    }
    onImageLoaded = image => {
        console.log("onImageLoaded, image:", image)
        const { profile_image_size } = this.props
        const size = Math.min(image.naturalWidth, image.naturalHeight)
        if (size < profile_image_size) {
            alert(`画像サイズが小さすぎます。（${image.naturalWidth}x${image.naturalHeight} < ${profile_image_size}x${profile_image_size}）`)
        }
        const crop = makeAspectCrop(
            {
                x: 0,
                y: 0,
                aspect: 1,
                width: 100,
            },
            image.naturalWidth / image.naturalHeight
        )
        const base64 = this.getCroppedImg(image, crop)
        this.setState({
            image,
            crop,
            "preview_src": base64,
            "shape": {
                width: image.naturalWidth,
                height: image.naturalHeight
            },
            "is_crop_ready": true
        })
    }
    onCropComplete = (crop, pixelCrop) => {
        console.log("onCropComplete, pixelCrop:", pixelCrop)
        const { image } = this.state
        const base64 = this.getCroppedImg(image, crop)
        this.setState({ "preview_src": base64 })
    }
    onCropChange = crop => {
        this.setState({ crop })
    }
    getCroppedImg = (image, crop) => {
        // cropは全ての値が%
        const { profile_image_size } = this.props
        const { extension } = this.state
        const canvas = document.createElement("canvas")
        const dom = this.refs.module
        const scaled_width = dom.clientWidth
        const scaled_height = dom.clientHeight
        const original_width = image.naturalWidth
        const scale = original_width / scaled_width
        const square_width = crop.width / 100.0 * scaled_width * scale	// crop.widthは%
        if (square_width < profile_image_size) {
            Toast.push(`切り抜き後のサイズが小さすぎます。（${Math.floor(square_width)} < ${profile_image_size}）`, false)
            return
        }
        const ctx = canvas.getContext("2d")
        canvas.width = square_width
        canvas.height = square_width
        ctx.drawImage(
            image,
            crop.x * scaled_width / 100.0 * scale,
            crop.y * scaled_height / 100.0 * scale,
            square_width,
            square_width,
            0,
            0,
            square_width,
            square_width
        )

        return canvas.toDataURL(extension, 1.0)
    }
    crop = () => {
        if (this.state.is_crop_ready === false) {
            Toast.push("画像を選択してください", false)
            return
        }
        if (this.state.update_in_progress === true) {
            return
        }
        this.setState({ "update_in_progress": true })
        const { image, crop } = this.state
        const base64 = this.getCroppedImg(image, crop)
        this.setState({ "preview_src": base64 })
        request
            .post("/account/avatar/update", {
                "data": base64
            })
            .then(res => {
                const { avatar_url, success, error } = res.data
                if (success == false) {
                    Toast.push(error, false)
                } else {
                    this.setState({ "preview_src": avatar_url })
                    Toast.push("アイコンを保存しました", true)
                }
            })
            .catch(error => {
                Toast.push(error.toString(), false)
            })
            .then(_ => {
                this.setState({ "update_in_progress": false })
            })
    }
    reset = () => {
        if (this.state.reset_in_progress === true) {
            return
        }
        this.setState({ "reset_in_progress": true })
        request
            .post("/account/avatar/reset", {})
            .then(res => {
                const { avatar_url, success, error } = res.data
                if (success == false) {
                    Toast.push(error, false)
                } else {
                    this.setState({ "preview_src": avatar_url })
                    Toast.push("アイコンをリセットしました", true)
                }
            })
            .catch(error => {
                Toast.push(error.toString(), false)
            })
            .then(_ => {
                this.setState({ "reset_in_progress": false })
            })
    }
    onFileChange = event => {
        const files = event.target.files
        if (files.length !== 1) {
            return
        }
        const file = files[0]
        const reader = new FileReader()
        reader.onload = event => {
            const src = reader.result
            const component = src.split(";")
            if (component.length !== 2) {
                Toast.push("問題が発生しました。ブラウザを変えると解消する可能性があります。", false)
                return
            }
            const extension = component[0].replace("data:", "")
            const allowed_extensions = ["image/jpeg", "image/png"]
            if (!!(allowed_extensions.includes(extension)) === false) {
                Toast.push("この拡張子には対応していません", false)
                return
            }
            this.setState({ src, extension })
        }
        reader.readAsDataURL(file)
    }
    render() {
        const { profile_image_size } = this.props
        return (
            <div className="settings-content-component">
                <div className="head">
                    <h1>アイコン</h1>
                </div>
                <div className="crop-module">
                    <div className="preview-container">
                        <img src={this.state.preview_src} className="preview" />
                    </div>
                    <div ref="module">
                        <CropComponent
                            crop_state={this.state}
                            image_size={profile_image_size}
                            callback_change={this.onCropChange}
                            callback_complete={this.onCropComplete}
                            callback_load={this.onImageLoaded} />
                    </div>
                    <input type="file" ref="file" accept="image/*" onChange={this.onFileChange} />
                </div>
                <SubmitAreaComponentOrNull
                    is_hidden={!this.state.is_crop_ready}
                    in_progress={this.state.update_in_progress}
                    handle_click={this.crop}
                    is_neutral_color={false}
                    label="保存する" />
                <div className="description">アイコンをリセットし、ランダムな色に戻すこともできます。</div>
                <SubmitAreaComponentOrNull
                    is_hidden={false}
                    in_progress={this.state.reset_in_progress}
                    handle_click={this.reset}
                    is_neutral_color={true}
                    label="リセットする" />
            </div>
        )
    }
}

class UserStatusComponent extends Component {
    constructor(props) {
        super(props)
        const { logged_in_user } = this.props
        const shortname = logged_in_user.status_emoji_shortname
        this.state = {
            "selected_emoji": null,
            "text": logged_in_user.status_text
        }
        if (shortname) {
            const category = get_category_by_shortname_or_null(shortname)
            this.state.selected_emoji = { shortname, category }
        }
    }
    onSelectEmoji = event => {
        event.preventDefault()
        let { target } = event
        if (target.tagName === "I") {
            target = target.parentElement
        }
        EmojiPicker.toggle(target, (shortname, category) => {
            this.setState({
                "selected_emoji": { shortname, category }
            })
            EmojiPicker.hide()
        })
    }
    onChangeText = event => {
        this.setState({ "text": event.target.value })
    }
    onClear = event => {
        event.preventDefault()
        this.setState({
            "selected_emoji": null,
            "text": ""
        })
    }
    render() {
        const { selected_emoji, text } = this.state
        return (
            <div className="item status">
                <h3 className="title">ステータス</h3>
                <div className="editor">
                    <button className={classnames("select-button", { "not-selected": selected_emoji === null })} onClick={this.onSelectEmoji}>
                        {(() => {
                            if (selected_emoji) {
                                const { shortname } = selected_emoji
                                return <img className="image" src={get_image_url_by_shortname_or_null(shortname)} />
                            } else {
                                return <i className="emoji-picker-ignore-click image"></i>
                            }
                        })()}
                    </button>
                    <input className={classnames("form-input", { "user-defined-border-color-focus": selected_emoji !== null })}
                        type="text"
                        readOnly={selected_emoji === null ? true : null}
                        value={text}
                        onChange={this.onChangeText} />
                    {selected_emoji ? <a className="delete-button" onClick={this.onClear}>デフォルトに戻す</a> : null}
                </div>
                <p className="hint">テキストは絵文字が設定されている場合のみ反映されます</p>
            </div>
        )
    }
}

export default class App extends AppComponent {
    render() {
        const { profile_image_size, platform, logged_in_user, pinned_emoji_shortnames } = this.props
        return (
            <div className="app settings">
                <Head title={`プロフィール / 設定 / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} is_bottom_hidden={true} />
                <Toast />
                <div className="client">
                    <div className="inside">
                        <div className="settings-menu-area">
                            <SettingsMenuComponent active_page="profile" />
                        </div>
                        <div className="settings-contents-area">
                            <ProfileComponent logged_in_user={logged_in_user} profile_image_size={profile_image_size} />
                            <AvatarComponent logged_in_user={logged_in_user} profile_image_size={profile_image_size} />
                        </div>
                    </div>
                </div>
                <EmojiPicker pinned_shortnames={pinned_emoji_shortnames} />
            </div>
        )
    }
}