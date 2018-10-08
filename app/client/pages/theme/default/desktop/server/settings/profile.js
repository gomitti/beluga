import { Component } from "react"
import { configure } from "mobx"
import Router from "next/router"
import classnames from "classnames"
import ReactCrop, { makeAspectCrop } from "react-image-crop"
import Head from "../../../../../../views/theme/default/desktop/head"
import NavigationBarView from "../../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../../views/theme/default/desktop/settings/server/menu"
import config from "../../../../../../beluga.config"
import { request } from "../../../../../../api"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        const { server } = props
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
            "preview_src": server.avatar_url,
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
        const { server } = this.props
        this.refs.display_name.value = server.display_name || ""
        this.refs.description.value = server.description || ""
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
        const { server } = this.props
        this.setState({ "preview_src": base64 })
        request
            .post("/server/avatar/update", {
                "server_id": server.id,
                "data": base64
            })
            .then(res => {
                const data = res.data
                const { avatar_url, success } = data
                if (success == false) {
                    alert(data.error)
                    return
                }
                server.avatar_url = avatar_url
                this.setState({ "preview_src": avatar_url })
                alert("保存しました")
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
        const { server } = this.props
        request
            .post("/server/avatar/reset", {
                "server_id": server.id
            })
            .then(res => {
                const data = res.data
                const { avatar_url, success } = data
                if (success == false) {
                    alert(data.error)
                    return
                }
                server.avatar_url = avatar_url
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
        const display_name = this.refs.display_name.value
        const description = this.refs.description.value
        if (this.pending === true) {
            return
        }
        const { server } = this.props
        this.pending = true
        request
            .post("/server/profile/update", {
                "server_id": server.id,
                display_name,
                description,
            })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                } else {
                    alert("保存しました")
                    server.display_name = data.server.display_name
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
        const { profile_image_size, platform, logged_in, server } = this.props
        const { preview_src } = this.state
        return (
            <div id="app" className="server-settings settings">
                <Head title={`プロフィール / 設定 / ${server.name} / ${config.site.name}`} platform={platform} logged_in={logged_in} />
                <NavigationBarView logged_in={logged_in} is_bottom_hidden={true} />
                <div className="settings-content">
                    <div className="inside">
                        <SettingsMenuView active="profile" server={server} />
                        <div className="settings-content-module">
                            <div className="settings-module form profile meiryo">
                                <div className="head">
                                    <h1>プロフィール</h1>
                                </div>

                                <div className="item">
                                    <h3 className="title">サーバー名</h3>
                                    <input className="form-input user-defined-border-color-focus" type="text" ref="display_name" />
                                    <p className="hint">日本語が使えます。</p>
                                </div>

                                <div className="item">
                                    <h3 className="title">概要</h3>
                                    <textarea className="form-input user-defined-border-color-focus" ref="description"></textarea>
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
            </div>
        )
    }
}