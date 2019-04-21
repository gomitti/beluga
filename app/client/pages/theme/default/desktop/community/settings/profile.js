import { Component } from "react"
import classnames from "classnames"
import ReactCrop, { makeAspectCrop } from "react-image-crop"
import Head from "../../../../../../views/theme/default/desktop/head"
import NavigationbarComponent from "../../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuComponent from "../../../../../../views/theme/default/desktop/settings/community/menu"
import BannerComponent from "../../../../../../views/theme/default/desktop/banner/community"
import config from "../../../../../../beluga.config"
import { request } from "../../../../../../api"
import AppComponent from "../../../../../../views/app"
import Toast from "../../../../../../views/theme/default/desktop/toast"
import { LoadingButton } from "../../../../../../views/theme/default/desktop/button"

class ProfileComponent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "in_progress": false
        }
    }
    componentDidMount() {
        const { community } = this.props
        this.refs.display_name.value = community.display_name || ""
        this.refs.description.value = community.description || ""
    }
    onUpdate = event => {
        const display_name = this.refs.display_name.value
        const description = this.refs.description.value
        if (this.state.in_progress === true) {
            return
        }
        const { community } = this.props
        this.setState({ "in_progress": true })
        setTimeout(() => {
            request
                .post("/community/profile/update", {
                    "community_id": community.id,
                    display_name,
                    description,
                })
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
        return (
            <div className="settings-content-component form profile">
                <div className="head">
                    <h1>プロフィール</h1>
                </div>

                <div className="item">
                    <h3 className="title">コミュニティ名</h3>
                    <input className="form-input user-defined-border-color-focus" type="text" ref="display_name" />
                    <p className="hint">日本語が使えます。</p>
                </div>

                <div className="item">
                    <h3 className="title">概要</h3>
                    <textarea className="form-input user-defined-border-color-focus" ref="description"></textarea>
                </div>

                <div className="submit">
                    <LoadingButton
                        handle_click={this.onUpdate}
                        is_loading={this.state.in_progress}
                        label="保存する" />
                </div>
            </div>
        )
    }
}

class AvatarComponent extends Component {
    constructor(props) {
        super(props)
        const { community } = props
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
            "preview_src": community.avatar_url,
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
            Toast.push(`画像サイズが小さすぎます。（${image.naturalWidth}x${image.naturalHeight} < ${profile_image_size}x${profile_image_size}）`, false)
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
            Toast.push("画像を選択してください", false)
            return
        }
        if (this.state.update_in_progress === true) {
            return
        }
        const { image, crop } = this.state
        const base64 = this.getCroppedImg(image, crop)
        const { community } = this.props
        this.setState({
            "preview_src": base64,
            "update_in_progress": true
        })
        request
            .post("/community/avatar/update", {
                "community_id": community.id,
                "data": base64
            })
            .then(res => {
                const data = res.data
                const { avatar_url, success, error } = data
                if (success == false) {
                    Toast.push(error, false)
                    return
                }
                community.avatar_url = avatar_url
                this.setState({ "preview_src": avatar_url })
                Toast.push("アイコンを保存しました", true)
            })
            .catch(error => {
                Toast.push(error.toString(), false)
            })
            .then(_ => {
                this.setState({
                    "update_in_progress": false
                })
            })
    }
    reset = () => {
        if (this.state.reset_in_progress === true) {
            return
        }
        this.setState({
            "reset_in_progress": true
        })
        const { community } = this.props
        request
            .post("/community/avatar/reset", {
                "community_id": community.id
            })
            .then(res => {
                const data = res.data
                const { avatar_url, success, error } = data
                if (success == false) {
                    Toast.push(error, false)
                } else {
                    community.avatar_url = avatar_url
                    this.setState({ "preview_src": avatar_url })
                    Toast.push("アイコンをリセットしました", true)
                }
            })
            .catch(error => {
                Toast.push(error.toString(), false)
            })
            .then(_ => {
                this.setState({
                    "reset_in_progress": false
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
        const { preview_src, profile_image_size } = this.state
        return (
            <div className="settings-content-component">
                <div className="head">
                    <h1>アイコン</h1>
                </div>
                <div className="crop-module">
                    <div className="preview-container">
                        <img src={preview_src} className="preview" />
                    </div>
                    <div ref="module">
                        {(typeof window === "undefined")
                            ? null :
                            <ReactCrop
                                {...this.state}
                                profile_image_size={profile_image_size}
                                onImageLoaded={this.onImageLoaded}
                                onComplete={this.onCropComplete}
                                onChange={this.onCropChange}
                            />
                        }
                    </div>
                    <input type="file" ref="file" accept="image/*" onChange={this.onFileChange} />
                </div>
                {(() => {
                    if (this.state.is_crop_ready) {
                        return (
                            <div className="submit">
                                <LoadingButton
                                    handle_click={this.crop}
                                    is_loading={this.state.update_in_progress}
                                    label="保存する" />
                            </div>
                        )
                    }
                })()}
                <div className="description">
                    アイコンをリセットし、ランダムな色に戻すこともできます。
								</div>
                <div className="submit">
                    <LoadingButton
                        handle_click={this.reset}
                        is_loading={this.state.reset_in_progress}
                        is_neutral_color={true}
                        label="リセットする" />
                </div>
            </div>
        )
    }
}

export default class App extends AppComponent {
    render() {
        const { profile_image_size, platform, logged_in_user, community } = this.props
        return (
            <div className="app community-settings settings">
                <Head title={`プロフィール / 設定 / ${community.name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} is_bottom_hidden={true} />
                <BannerComponent title="設定" community={community} />
                <Toast />
                <div className="client">
                    <div className="inside">
                        <div className="settings-menu-area">
                            <SettingsMenuComponent active_page="profile" community={community} />
                        </div>
                        <div className="settings-contents-area">
                            <ProfileComponent community={community} />
                            <AvatarComponent community={community} profile_image_size={profile_image_size} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}