import React, { Component } from "react"
import assert from "../../../../assert"
import assign from "../../../../libs/assign"
import { request } from "../../../../api"
import { PostboxMediaView } from "./postbox/media"
import classnames from "classnames"
import { sync as uid } from "uid-safe"

export default class PostboxView extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_post_button_active": false,
            "show_media_favorites": false,
            "show_media_history": false,
            "show_text_actions": false,
            "show_emoji_picker": false,
            "drag_entered": false,
            "uploading_files": [],
            "uploaded_files": [],
        }
    }
    componentDidMount() {
        const { textarea } = this.refs
        if (textarea) {
            textarea.focus()
        }

    }
    toggleMediaView = event => {
        event.preventDefault()
        this.setState({
            "show_media_favorites": !this.state.show_media_favorites
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
        const { hashtag, recipient, server } = this.props
        if (hashtag) {	// ルームへの投稿
            query.hashtag_id = hashtag.id
        } else if (recipient && server) {	// ユーザーのホームへの投稿
            query.recipient_id = recipient.id
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
                textarea.value = ""
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
            this.timer_shift = setTimeout(function () {
                this.is_shift_key_down = false
            }.bind(this), 5000)
        }
        if (event.keyCode == 17) {
            this.is_ctrl_key_down = true
            if (this.timer_ctrl) {
                clearTimeout(this.timer_ctrl)
            }
            this.timer_ctrl = setTimeout(function () {
                this.is_ctrl_key_down = false
            }.bind(this), 5000)
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
    setText(str) {
        const { textarea } = this.refs
        textarea.value = str
        if (str.length === 0) {
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
        if (!data.match(/^https?:\/\/[^\s ]+$/)) {
            return
        }
        // ファイルはそのままペースト
        const components = data.split("/")
        const filename = components[components.length - 1]
        if (filename.indexOf(".") !== -1) {
            if (!filename.match(/\.(html|htm|php|cgi)/)) {
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
                target.value = prefix + data
                return
            }
            target.value = prefix + data + "\n" + target.value
            return
        }
        if (position === target.value.length) {
            if (target.value[target.value.length - 1] === "\n") {
                target.value = target.value + prefix + data
                return
            }
            target.value = target.value + "\n" + prefix + data
            return
        }
        target.value = target.value.substring(0, position) + "\n" + prefix + data + "\n" + target.value.substring(position)
    }
    onChangeText = event => {
        const { textarea } = this.refs
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
    fileWillUpload = file => {
        const { uploading_files } = this.state
        uploading_files.push(file)
        this.setState({
            uploading_files
        })
    }
    fileDidUpload = uploaded_file => {
        let index = -1
        for (let i = 0; i < this.state.uploading_files.length; i++) {
            const file = this.state.uploading_files[i]
            if (uploaded_file.identifier === file.identifier) {
                index = i
                break
            }
        }
        assert(index !== -1)
        let { uploaded_files, uploading_files } = this.state
        uploading_files.splice(index, 1)
        uploaded_files.push(uploaded_file)
        if (uploading_files.length === 0) {
            uploading_files = []
            uploaded_files = []
        }
        this.setState({
            uploading_files, uploaded_files
        })
    }
    onDrop = event => {
        const transfer = event.dataTransfer;
        if (!transfer) {
            return true;
        }
        const str = transfer.getData("text")	// テキストのドロップは無視
        if (str) {
            return true;
        }
        event.preventDefault();
        if (transfer.files.length == 0) {
            alert("ファイルを取得できません")
            return false;
        }
        for (let file of transfer.files) {
            file.identifier = uid(12)
            this.fileWillUpload(file)
            const reader = new FileReader()
            reader.onerror = event => {
                alert(`${file.name}を読み込めませんでした`)
            }
            reader.onload = event => {
                const endpoint = reader.result.indexOf("data:video") === 0 ? "/media/video/upload" : "/media/image/upload"
                request
                    .post(endpoint, {
                        "data": reader.result
                    })
                    .then(res => {
                        const data = res.data
                        if (data.error) {
                            alert(data.error)
                            return
                        }
                        const url = data.urls.original
                        const { textarea } = this.refs
                        if (textarea.value.length == 0) {
                            this.setText(url)
                        } else {
                            this.setText(textarea.value + "\n" + url)
                        }
                    })
                    .catch(error => {
                        alert(error)
                    })
                    .then(_ => {
                        this.fileDidUpload(file)
                    })
            }
            reader.readAsDataURL(file)
        }
    }
    onFileChange = event => {
        const files = event.target.files
        for (const file of files) {
            file.identifier = uid(12)
            this.fileWillUpload(file)
            const reader = new FileReader()
            reader.onload = event => {
                const endpoint = reader.result.indexOf("data:video") === 0 ? "/media/video/upload" : "/media/image/upload"
                request
                    .post(endpoint, {
                        "data": reader.result
                    })
                    .then(res => {
                        const data = res.data
                        if (data.error) {
                            alert(data.error)
                            return
                        }
                        const url = data.urls.original
                        const { textarea } = this.refs
                        if (textarea.value.length == 0) {
                            this.setText(url)
                        } else {
                            this.setText(textarea.value + "\n" + url)
                        }
                    })
                    .catch(error => {
                        alert(error)
                    })
                    .then(_ => {
                        this.fileDidUpload(file)
                    })
            }
            reader.readAsDataURL(file)
        }
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
            "show_media_history": !this.state.show_media_history
        })
    }
    onClickActionMediaFavorites = event => {
        event.preventDefault()
        if (event.target.nodeName === "SPAN") {
            return
        }
        this.setState({
            "show_media_favorites": !this.state.show_media_favorites
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
    render() {
        const { logged_in, media_favorites, media_history } = this.props
        if (!logged_in) {
            return (
                <div>投稿するには<a href="/login">ログイン</a>してください</div>
            )
        }
        let uploadProgressView = null
        if (this.state.uploading_files.length > 0) {
            uploadProgressView =
                <div className="postbox-upload-progress">
                    <p>
                        <span className="filename">{this.state.uploading_files[0].name}</span>
                        <span>をアップロードしています...</span>
                        {this.state.uploading_files.length + this.state.uploaded_files.length === 1 ?
                            null :
                            <span>({this.state.uploaded_files.length + 1}/{this.state.uploading_files.length + this.state.uploaded_files.length})</span>
                        }
                    </p>
                </div>
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
                        {uploadProgressView}
                        <div className="postbox-footer">
                            <input className="hidden" type="file" ref="file" accept="image/*, video/*" onChange={this.onFileChange} multiple />
                            <div className="actions">
                                <div className="unit">
                                    <button className="tooltip-button action media-upload" onClick={this.onClickActionMediaUpload}>
                                        <span className="tooltip"><span className="text">アップロード</span></span>
                                    </button>
                                    <button className={classnames("tooltip-button action media-history user-defined-color-active", {
                                        "active": this.state.show_media_history
                                    })} onClick={this.onClickActionMediaHistory}>
                                        <span className="tooltip"><span className="text">アップロード履歴</span></span>
                                    </button>
                                    <button
                                        className={classnames("tooltip-button action media-favorites user-defined-color-active", {
                                            "active": this.state.show_media_favorites
                                        })} onClick={this.onClickActionMediaFavorites}>
                                        <span className="tooltip"><span className="text">お気に入りの画像</span></span>
                                    </button>
                                    <button className={classnames("tooltip-button action emoji emojipicker-ignore-click user-defined-color-active", {
                                        "active": this.state.show_emoji_picker
                                    })} onClick={this.onClickActionEmoji}>
                                        <span className="tooltip"><span className="text">絵文字を入力</span></span>
                                    </button>
                                </div>
                                <div className="unit">
                                    <button className="tooltip-button action preview" onClick={this.onClickActionEmoji}>
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
                                        <button className="tooltip-button action text-code">
                                            <span className="tooltip"><span className="text">コード</span></span>
                                        </button>
                                    </div>
                                    : null}
                            </div>
                            <div className="submit">
                                <button className={classnames("button meiryo", {
                                    "ready user-defined-bg-color": !this.state.is_pending && this.state.is_post_button_active,
                                    "neutral": !this.state.is_pending && !this.state.is_post_button_active,
                                    "in-progress": this.state.is_pending,
                                })} onClick={this.post}>投稿する</button>
                            </div>
                        </div>
                        {media_favorites ?
                            <PostboxMediaView
                                is_hidden={!this.state.show_media_favorites}
                                media={media_favorites}
                                title="お気に入りの画像"
                                append={this.appendMediaLink} />
                            : null}
                        {media_history ?
                            <PostboxMediaView
                                is_hidden={!this.state.show_media_history}
                                media={media_history}
                                title="アップロード履歴"
                                append={this.appendMediaLink} />
                            : null}
                    </div>
                </div>
            </div>
        )
    }
}