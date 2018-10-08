import { Component } from "react"
import { configure } from "mobx"
import classnames from "classnames"
import Router from "next/router"
import ReactCrop, { makeAspectCrop } from "react-image-crop"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationbarView from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import { get_category_by_shortname_or_null, get_image_url_by_shortname_or_null, EmojiPickerStore } from "../../../../../stores/theme/default/common/emoji"
import { is_object } from "../../../../../assert"
import EmojiPicker from "../../../../../views/theme/default/desktop/emoji"
import Snackbar from "../../../../../views/theme/default/desktop/snackbar"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

class UserStatusModuleItem extends Component {
    constructor(props) {
        super(props)
        const { logged_in } = this.props
        const shortname = logged_in.status_emoji_shortname
        this.state = {
            "selected_emoji": null,
            "text": logged_in.status_text
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
                                return <i className="emojipicker-ignore-click image"></i>
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

export default class App extends Component {
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        const { logged_in } = props
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
            "preview_src": logged_in.avatar_url,
            "is_crop_ready": false,
            "pending_update": false,
            "pending_reset": false,
        }
        request.set_csrf_token(this.props.csrf_token)

        if (typeof history !== "undefined") {
            history.scrollRestoration = "manual"
        }

        // Safariのブラウザバック問題の解消
        if (typeof window !== "undefined") {
            Router.beforePopState(({ url, as, options }) => {
                return false
            });

        }
    }
    componentDidMount() {
        // stateで管理するのはあまり好きではない
        const { logged_in } = this.props
        if (!!logged_in.profile == false) {
            return
        }
        this.refs.display_name.value = logged_in.display_name || ""
        this.refs.description.value = logged_in.profile.description || ""
        this.refs.location.value = logged_in.profile.location || ""

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
            alert(`切り抜き後のサイズが小さすぎます。（${Math.floor(square_width)} < ${profile_image_size}）`)
            return
        }
        console.log("scale:", scale)
        console.log("scaled_width:", scaled_width)
        console.log("original_width:", original_width)
        console.log("square_width:", square_width)
        const ctx = canvas.getContext("2d")
        console.log(crop)
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
            alert("画像を選択してください")
            return
        }
        if (this.state.pending_update === true) {
            return
        }
        this.setState({
            "pending_update": true
        })
        const { image, crop } = this.state
        const base64 = this.getCroppedImg(image, crop)
        this.setState({ "preview_src": base64 })
        request
            .post("/account/avatar/update", {
                "data": base64
            })
            .then(res => {
                const data = res.data
                const { avatar_url, success } = data
                if (success == false) {
                    alert(data.error)
                    return
                }
                this.setState({ "preview_src": avatar_url })
                Snackbar.show("保存しました", false)
            })
            .catch(error => {
                alert(error)
            })
            .then(_ => {
                this.setState({
                    "pending_update": false
                })
            })
    }
    reset = () => {
        if (this.state.pending_reset === true) {
            return
        }
        this.setState({
            "pending_reset": true
        })
        request
            .post("/account/avatar/reset", {})
            .then(res => {
                const data = res.data
                const { avatar_url, success } = data
                if (success == false) {
                    alert(data.error)
                    return
                }
                this.setState({ "preview_src": avatar_url })
                alert("保存しました")
            })
            .catch(error => {
                alert(error)
            })
            .then(_ => {
                this.setState({
                    "pending_reset": false
                })
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
                alert("問題が発生しました。ブラウザを変えると解消する可能性があります。")
                return
            }
            const extension = component[0].replace("data:", "")
            const allowed_extensions = ["image/jpeg", "image/png"]
            if (!!(allowed_extensions.includes(extension)) === false) {
                alert("この拡張子には対応していません")
                return
            }
            this.setState({ src, extension })
        }
        reader.readAsDataURL(file)
    }
    onUpdateProfile = event => {
        event.preventDefault()
        const display_name = this.refs.display_name.value
        const description = this.refs.description.value
        const location = this.refs.location.value
        const status = this.refs.status
        if (this.pending === true) {
            return
        }
        this.pending = true
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
        request
            .post("/account/profile/update", params)
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                } else {
                    Snackbar.show("保存しました", false)
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
        const { profile_image_size, platform, logged_in, pinned_emoji_shortnames } = this.props
        const { preview_src } = this.state
        if (!!logged_in.profile === false) {
            return null
        }
        return (
            <div id="app" className="settings">
                <Head title={`プロフィール / 設定 / ${config.site.name}`} platform={platform} logged_in={logged_in} />
                <NavigationbarView logged_in={logged_in} is_bottom_hidden={true} />
                <div className="settings-content">
                    <div className="inside">
                        <SettingsMenuView active="profile" />
                        <div className="settings-content-module">
                            <div className="settings-module form profile meiryo">
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

                                <UserStatusModuleItem ref="status" logged_in={logged_in} />

                                <div className="item">
                                    <h3 className="title">場所</h3>
                                    <input className="form-input user-defined-border-color-focus" type="text" ref="location" />
                                </div>


                                <div className="submit">
                                    <button className="button user-defined-bg-color" onClick={this.onUpdateProfile}>プロフィールを保存</button>
                                </div>
                            </div>

                            <div className="settings-module">
                                <div className="head">
                                    <h1>アイコン</h1>
                                </div>
                                <div className="crop-module">
                                    <div className="preview-container">
                                        <img src={preview_src} className="preview" />
                                    </div>
                                    <div ref="module">
                                        <ReactCrop
                                            {...this.state}
                                            profile_image_size={profile_image_size}
                                            onImageLoaded={this.onImageLoaded}
                                            onComplete={this.onCropComplete}
                                            onChange={this.onCropChange}
                                        />
                                    </div>
                                    <input type="file" ref="file" accept="image/*" onChange={this.onFileChange} />
                                </div>
                                {(() => {
                                    if (this.state.is_crop_ready) {
                                        return (
                                            <div className="submit">
                                                <button className={classnames("button user-defined-bg-color", { "in-progress": this.state.pending_update })} onClick={this.crop}>アイコンを保存</button>
                                            </div>
                                        )
                                    }
                                })()}
                                <div className="description">
                                    アイコンをリセットし、ランダムな色に戻すこともできます。
								</div>
                                <div className="submit">
                                    <button className={classnames("button neutral", { "in-progress": this.state.pending_reset })} onClick={this.reset}>アイコンをリセット</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <EmojiPicker pinned_shortnames={pinned_emoji_shortnames} />
            </div>
        )
    }
}