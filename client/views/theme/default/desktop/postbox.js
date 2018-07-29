import React, { Component } from "react"
import { observer } from "mobx-react"
import classnames from "classnames"
import assert from "../../../../assert"
import assign from "../../../../libs/assign"
import { request } from "../../../../api"
import MediaView from "./postbox/media"
import PreviewView from "./postbox/preview"
import ProgressView from "./postbox/upload"
import { convert_bytes_to_optimal_unit } from "../../../../libs/functions"

@observer
export default class PostboxView extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_post_button_active": false,
            "show_pinned_media": false,
            "show_recent_uploads": false,
            "show_text_actions": false,
            "show_emoji_picker": false,
            "drag_entered": false,
            "show_preview": false,
            "preview_text": ""
        }
    }
    componentDidMount = () => {
        const { textarea } = this.refs
        if (textarea) {
            textarea.focus()
        }
        const { uploader } = this.props
        uploader.error_callback = () => {

        }
        uploader.uploaded_callback = url => {
            const { textarea } = this.refs
            if (textarea.value.length == 0) {
                this.setText(url)
            } else {
                this.setText(textarea.value + "\n" + url)
            }
        }
    }
    toggleMediaView = event => {
        event.preventDefault()
        this.setState({
            "show_pinned_media": !this.state.show_pinned_media
        })
    }
    appendMediaLink = (event, item) => {
        event.preventDefault()
        const { textarea } = this.refs
        if (textarea.value.length === 0) {
            this.setText(`${item.source}`)
        } else {
            this.setText(textarea.value + "\n" + `${item.source}`)
        }
    }
    post = event => {
        if (event) {
            event.preventDefault()
        }
        if (this.pending === true) {
            return
        }
        this.setState({ "is_pending": true })
        const { textarea } = this.refs
        const text = textarea.value
        if (text.length == 0) {
            alert("本文を入力してください")
            this.setState({ "is_pending": false, "is_post_button_active": false })
            return
        }
        const query = { text }
        const { hashtag, user, server } = this.props
        if (hashtag) {	// ルームへの投稿
            query.hashtag_id = hashtag.id
        } else if (user && server) {	// ユーザーのホームへの投稿
            query.recipient_id = user.id
            query.server_id = server.id
        } else {
            assert(false, "Invalid post target")
        }

        request
            .post("/status/update", query)
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    this.setState({ "is_pending": false, "is_post_button_active": true })
                    return
                }
                this.setText("")
                this.setState({ "is_pending": false, "is_post_button_active": false })
            })
            .catch(error => {
                alert(error)
                this.setState({ "is_pending": false, "is_post_button_active": true })
            })
            .then(_ => {
                textarea.focus()
            })
    }
    onKeyUp = event => {
        if (event.keyCode == 16) {
            this.is_shift_key_down = false
            return
        }
        if (event.keyCode == 17) {
            this.is_ctrl_key_down = false
            return
        }
    }
    onKeyDown = event => {
        if (event.keyCode == 16) {
            this.is_shift_key_down = true
            if (this.timer_shift) {
                clearTimeout(this.timer_shift)
            }
            this.timer_shift = setTimeout(() => {
                this.is_shift_key_down = false
            }, 200)
        }
        if (event.keyCode == 17) {
            this.is_ctrl_key_down = true
            if (this.timer_ctrl) {
                clearTimeout(this.timer_ctrl)
            }
            this.timer_ctrl = setTimeout(() => {
                this.is_ctrl_key_down = false
            }, 200)
        }
        if (event.keyCode == 13) {
            const { textarea } = this.refs
            if (this.is_shift_key_down) {
                event.preventDefault()
                this.post()
                return
            }
            if (this.is_ctrl_key_down) {
                event.preventDefault()
                this.post()
                return
            }
            return
        }
    }
    updatePreviewText = () => {
        if (this.state.show_preview === false) {
            return
        }
        const { textarea } = this.refs
        this.setState({
            "preview_text": textarea ? textarea.value : ""
        })
    }
    setText(string) {
        const { textarea } = this.refs
        textarea.value = string

        if (this.preview_timer) {
            clearTimeout(this.preview_timer)
        }
        this.preview_timer = setTimeout(this.updatePreviewText, 200)

        if (string.length === 0) {
            return this.setState({
                "is_post_button_active": false
            })
        }
        this.setState({
            "is_post_button_active": true
        })
    }
    onPasteText = event => {
        const { target, clipboardData } = event
        const data = clipboardData.getData("Text")
        // URL以外はそのままペースト
        if (!!data.match(/^https?:\/\/[^\s　]+$/) === false) {
            return
        }
        // ファイルはそのままペースト
        const components = data.split("/")
        const filename = components[components.length - 1]
        if (filename.indexOf(".") !== -1) {
            if (!!filename.match(/\.(html|htm|php|cgi)/) === false) {
                return
            }
        }
        event.preventDefault()
        let prefix = ""
        if (window.confirm("リンク先のプレビューを有効にしますか？")) {
            prefix = "!"
        }
        const position = target.selectionStart
        if (position === 0) {
            if (target.value.length === 0) {
                this.setText(prefix + data)
                return
            }
            this.setText(prefix + data + "\n" + target.value)
            return
        }
        if (position === target.value.length) {
            if (target.value[target.value.length - 1] === "\n") {
                this.setText(target.value + prefix + data)
                return
            }
            this.setText(target.value + "\n" + prefix + data)
            return
        }
        this.setText(target.value.substring(0, position) + "\n" + prefix + data + "\n" + target.value.substring(position))
    }
    onChangeText = event => {
        const { textarea } = this.refs

        if (this.preview_timer) {
            clearTimeout(this.preview_timer)
        }
        this.preview_timer = setTimeout(this.updatePreviewText, 200)

        if (textarea.value.length === 0 && this.state.is_post_button_active === true) {
            return this.setState({
                "is_post_button_active": false
            })
        }
        if (textarea.value.length >= 0 && this.state.is_post_button_active === false) {
            return this.setState({
                "is_post_button_active": true
            })
        }
    }
    onDragOver = event => {
        if (this.state.drag_entered === false) {
            this.setState({ "drag_entered": true })
        }
        if (window.chrome) {
            return true;
        }
        event.preventDefault()
    }
    onDragEnd = event => {
        if (this.state.drag_entered) {
            this.setState({ "drag_entered": false })
        }
    }
    onDrop = event => {
        const transfer = event.dataTransfer
        if (!!transfer === false) {
            return true
        }
        const string = transfer.getData("text")	// テキストのドロップは無視
        if (string) {
            return true
        }
        const { files } = transfer
        if (files.length == 0) {
            return true
        }
        event.preventDefault()
        const { uploader } = this.props
        for (const file of files) {
            uploader.add(file)
        }
    }
    onFileChange = event => {
        const { uploader } = this.props
        const { files } = event.target
        for (const file of files) {
            uploader.add(file)
        }
        this.refs.file.value = ""
    }
    onClickActionMediaUpload = event => {
        event.preventDefault()
        if (event.target.nodeName === "SPAN") {
            return
        }
        const { file } = this.refs
        if (file) {
            file.click()
        }
    }
    onClickActionMediaHistory = event => {
        event.preventDefault()
        if (event.target.nodeName === "SPAN") {
            return
        }
        this.setState({
            "show_recent_uploads": !this.state.show_recent_uploads,
            "show_pinned_media": false,
        })
    }
    onClickActionPinnedMedia = event => {
        event.preventDefault()
        if (event.target.nodeName === "SPAN") {
            return
        }
        this.setState({
            "show_pinned_media": !this.state.show_pinned_media,
            "show_recent_uploads": false
        })
    }
    onClickActionPreview = event => {
        event.preventDefault()
        if (event.target.nodeName === "SPAN") {
            return
        }
        const { textarea } = this.refs
        this.setState({
            "show_preview": !this.state.show_preview,
            "preview_text": textarea ? textarea.value : ""
        })
    }
    onClickActionEmoji = event => {
        event.preventDefault()
        if (event.target.nodeName === "SPAN") {
            return
        }
        const { x, y } = event.target.getBoundingClientRect()
        if (emojipicker.is_hidden) {
            emojipicker.show(x, y + 40, shortname => {
                const { textarea } = this.refs
                this.setText(textarea.value + `:${shortname}:`)
            }, () => {
                this.setState({
                    "show_emoji_picker": false
                })
            })
        } else {
            emojipicker.hide()
        }
        this.setState({
            "show_emoji_picker": !emojipicker.is_hidden
        })
    }
    onClickActionText = event => {
        event.preventDefault()
        if (event.target.nodeName === "SPAN") {
            return
        }
        this.setState({
            "show_text_actions": !this.state.show_text_actions
        })
    }
    onClickActionTextCode = event => {
        event.preventDefault()
        if (event.target.nodeName === "SPAN") {
            return
        }
        const { textarea } = this.refs
        if (textarea.value.length === 0) {
            this.setText('"""\n\n"""')
        } else {
            this.setText(textarea.value + "\n" + '"""\n\n"""')
        }
    }
    render() {
        const { logged_in, pinned_media, recent_uploads } = this.props
        if (!!logged_in === false) {
            return (
                <div>投稿するには<a href="/login">ログイン</a>してください</div>
            )
        }

        const { uploader } = this.props
        const { uploading_file_metadatas } = uploader

        const preview_status = {
            "text": this.state.preview_text,
            "user": logged_in,
            "server": {}
        }
        return (
            <div className="postbox-module" onDragOver={this.onDragOver} onDragEnd={this.onDragEnd} onDragLeave={this.onDragEnd} onDrop={this.onDrop}>
                <div className="inside">
                    <div className="postbox-left">
                        <a href="/user/" className="avatar link">
                            <img src={logged_in.avatar_url} />
                        </a>
                    </div>
                    <div className="postbox-right">
                        <div className="postbox-content">
                            <div className="body">
                                <textarea
                                    className={classnames("form-input user-defined-border-color-focus user-defined-border-color-drag-entered", { "drag-entered": this.state.drag_entered })}
                                    ref="textarea"
                                    onChange={this.onChangeText}
                                    onPaste={this.onPasteText}
                                    onKeyUp={this.onKeyUp}
                                    onKeyDown={this.onKeyDown} />
                            </div>
                        </div>
                        <ProgressView metadatas={uploading_file_metadatas} />
                        <div className="postbox-footer">
                            <input className="hidden" type="file" ref="file" accept="image/*, video/*" onChange={this.onFileChange} multiple />
                            <div className="actions">
                                <div className="unit">
                                    <button className="tooltip-button action media-upload" onClick={this.onClickActionMediaUpload}>
                                        <span className="tooltip"><span className="text">アップロード</span></span>
                                    </button>
                                    <button className={classnames("tooltip-button action media-history user-defined-color-active", {
                                        "active": this.state.show_recent_uploads
                                    })} onClick={this.onClickActionMediaHistory}>
                                        <span className="tooltip"><span className="text">アップロード履歴</span></span>
                                    </button>
                                    <button
                                        className={classnames("tooltip-button action media-pinned user-defined-color-active", {
                                            "active": this.state.show_pinned_media
                                        })} onClick={this.onClickActionPinnedMedia}>
                                        <span className="tooltip"><span className="text">よく使う画像</span></span>
                                    </button>
                                    <button className={classnames("tooltip-button action emoji emojipicker-ignore-click user-defined-color-active", {
                                        "active": this.state.show_emoji_picker
                                    })} onClick={this.onClickActionEmoji}>
                                        <span className="tooltip"><span className="text">絵文字を入力</span></span>
                                    </button>
                                </div>
                                <div className="unit">
                                    <button className={classnames("tooltip-button action preview", {
                                        "active": this.state.show_preview
                                    })} onClick={this.onClickActionPreview}>
                                        <span className="tooltip"><span className="text">投稿プレビュー</span></span>
                                    </button>
                                    <button className={classnames("tooltip-button action text-editing user-defined-color-active", {
                                        "active": this.state.show_text_actions
                                    })} onClick={this.onClickActionText}>
                                        <span className="tooltip"><span className="text">テキストの装飾</span></span>
                                    </button>
                                    <button className="tooltip-button action misc">
                                        <span className="tooltip"><span className="text">その他</span></span>
                                    </button>
                                </div>
                                {this.state.show_text_actions ?
                                    <div className="unit">
                                        <button className="tooltip-button action text-big">
                                            <span className="tooltip"><span className="text">サイズ</span></span>
                                        </button>
                                        <button className="tooltip-button action text-bold">
                                            <span className="tooltip"><span className="text">太字</span></span>
                                        </button>
                                        <button className="tooltip-button action text-underline">
                                            <span className="tooltip"><span className="text">下線</span></span>
                                        </button>
                                        <button className="tooltip-button action text-strikethrough">
                                            <span className="tooltip"><span className="text">打ち消し線</span></span>
                                        </button>
                                        <button className="tooltip-button action text-italic">
                                            <span className="tooltip"><span className="text">イタリック</span></span>
                                        </button>
                                        <button className="tooltip-button action text-code" onClick={this.onClickActionTextCode}>
                                            <span className="tooltip"><span className="text">コード</span></span>
                                        </button>
                                    </div>
                                    :
                                    null
                                }
                            </div>
                            <div className="submit">
                                <button className={classnames("button meiryo", {
                                    "ready user-defined-bg-color": !this.state.is_pending && this.state.is_post_button_active,
                                    "neutral": !this.state.is_pending && !this.state.is_post_button_active,
                                    "in-progress": this.state.is_pending,
                                })} onClick={this.post}>
                                    <span className="progress-text">投稿する</span>
                                    <span className="display-text">投稿する</span>
                                </button>
                            </div>
                        </div>
                        <MediaView
                            is_hidden={!this.state.show_pinned_media}
                            media={pinned_media}
                            title="よく使う画像"
                            append={this.appendMediaLink} />
                        <MediaView
                            is_hidden={!this.state.show_recent_uploads}
                            media={recent_uploads}
                            title="アップロード履歴"
                            append={this.appendMediaLink} />
                    </div>
                </div>
                <div className="preview postbox-preview-bg-color">
                    <PreviewView is_hidden={!this.state.show_preview} status={preview_status} />
                </div>
            </div>
        )
    }
}