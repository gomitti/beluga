import React, { Component } from "react"
import assert from "../../../../assert"
import assign from "../../../../libs/assign"
import { request } from "../../../../api"
import { PostboxMediaView } from "./postbox/media"
import classnames from "classnames"
import { sync as uid } from "uid-safe"
import Button from "./button"

export default class PostboxView extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_post_button_active": false,
            "show_media_favorites": false,
            "show_media_history": false,
            "show_text_actions": false,
            "uploading_files": [],
            "uploaded_files": [],
            "upload_status_text": null
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
                    textarea.focus()
                    return
                }
                textarea.value = ""
                this.setState({ "is_pending": false, "is_post_button_active": false })
            })
            .catch(error => {
                alert(error)
                this.setState({ "is_pending": false, "is_post_button_active": true })
                textarea.focus()
            })
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
    fileWillUpload = file => {
        const { uploading_files } = this.state
        uploading_files.push(file)
        this.setState({
            uploading_files,
            "upload_status_text": `${file.name}をアップロードします`
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
    onFileChange = event => {
        const files = event.target.files
        for (const file of files) {
            this.setState({
                "upload_status_text": `${file.name}を読み込み中です`
            })
            file.identifier = uid(12)
            this.fileWillUpload(file)
            const reader = new FileReader()
            reader.onerror = event => {
                this.setState({
                    "upload_status_text": `${file.name}を読み込めませんでした`
                })
            }
            reader.onload = event => {
                this.setState({
                    "upload_status_text": `${file.name}の読み込みが完了しました`
                })
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
                        this.setState({
                            "upload_status_text": null
                        })
                    })
            }
            reader.readAsDataURL(file)
        }
    }
    onClickActionMediaUpload = event => {
        event.preventDefault()
        const { file } = this.refs
        if (file) {
            file.click()
        }
    }
    onClickActionMediaHistory = event => {
        event.preventDefault()
        this.setState({
            "show_media_history": !this.state.show_media_history
        })
    }
    onClickActionMediaFavorites = event => {
        event.preventDefault()
        this.setState({
            "show_media_favorites": !this.state.show_media_favorites
        })
    }
    onClickActionText = event => {
        event.preventDefault()
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
        let uploadStatusView = null
        if (this.state.upload_status_text) {
            uploadStatusView =
                <div className="postbox-upload-progress">
                    <p><span>{this.state.upload_status_text}</span></p>
                </div>
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
                                    onPaste={this.onPasteText} />
                            </div>
                        </div>
                        {uploadStatusView}
                        {uploadProgressView}
                        <div className="postbox-footer">
                            <input className="hidden" type="file" ref="file" accept="image/*, video/*" onChange={this.onFileChange} multiple />
                            <div className="actions">
                                <div className="unit">
                                    <Button className="action media-upload" onClick={this.onClickActionMediaUpload}></Button>
                                    <Button className={classnames("action media-history user-defined-color-active", {
                                        "active": this.state.show_media_history
                                    })} onClick={this.onClickActionMediaHistory}></Button>
                                    <Button className={classnames("action media-favorites user-defined-color-active", {
                                        "active": this.state.show_media_favorites
                                    })} onClick={this.onClickActionMediaFavorites}></Button>
                                </div>
                                <div className="unit">
                                    <Button className="action preview" onClick={this.onClickActionEmoji}></Button>
                                    <Button className={classnames("action text-editing user-defined-color-active", {
                                        "active": this.state.show_text_actions
                                    })} onClick={this.onClickActionText}></Button>
                                    <Button className="action misc"></Button>
                                </div>
                                {this.state.show_text_actions ?
                                    <div className="unit">
                                        <Button className="action text-big"></Button>
                                        <Button className="action text-bold"></Button>
                                        <Button className="action text-underline"></Button>
                                        <Button className="action text-strikethrough"></Button>
                                        <Button className="action text-italic"></Button>
                                    </div>
                                    : null}
                            </div>
                            <div className="submit">
                                <Button className={classnames("button meiryo", {
                                    "ready user-defined-bg-color": !this.state.is_pending && this.state.is_post_button_active,
                                    "neutral": !this.state.is_pending && !this.state.is_post_button_active,
                                    "in-progress": this.state.is_pending,
                                })} onClick={this.post}>投稿する</Button>
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