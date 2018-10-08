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
import config from "../../../../beluga.config"
import Tooltip from "./tooltip"
import EmojiPicker from "./emoji"

class TooltipButton extends Component {
    render() {
        const { type, handle_click, is_active, description } = this.props
        return (
            <button className={classnames(`tooltip-button action ${type} emojipicker-ignore-click user-defined-color-active`, {
                "active": !!is_active
            })}
                onClick={handle_click}
                ref={dom => this.dom = dom}
                onMouseEnter={() => Tooltip.show(this.dom, description, 6)}
                onMouseOver={() => Tooltip.show(this.dom, description, 6)}
                onMouseOut={() => Tooltip.hide(this.dom, description, 6)}>
            </button>
        )
    }
}

export const wrap_with_tag = (text, start, end, tag, insert_linebreak) => {
    const n = insert_linebreak ? "\n" : ""
    if (text.length === 0) {
        return `${tag}${n}${n}${tag}`
    }
    if (start === end) {
        return `${tag}${n}${text}${n}${tag}`
    }
    if (start === 0) {
        if (end === text.length) {
            return `${tag}${n}${text}${n}${tag}`
        }
        const first = text.substring(0, end)
        const second = text.substring(end, text.length)
        return `${tag}${n}${first}${n}${tag}${n}${second}`
    }
    if (end === text.length) {
        const first = text.substring(0, start)
        const second = text.substring(start)
        return `${first}${n}${tag}${n}${second}${n}${tag}`
    }
    const first = text.substring(0, start)
    const second = text.substring(start, end)
    const third = text.substring(end)
    return `${first}${n}${tag}${n}${second}${n}${tag}${n}${third}`
}

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
        const { postbox } = this.props
        if (postbox.is_pending === true) {
            return
        }
        const { textarea } = this.refs
        const text = textarea.value
        if (text.length == 0) {
            alert("本文を入力してください")
            this.setState({ "is_post_button_active": false })
            return
        }
        postbox.post(text, () => {
            this.setText("")
            this.setState({ "is_post_button_active": false })
        }, () => {
            this.setState({ "is_post_button_active": true })
        }, () => {
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
        const position = target.selectionStart
        if (position > 0) {
            const str = target.value.substring(position - 1, position)
            if (str === "!") {
                return;
            }
        }
        event.preventDefault()
        let prefix = ""
        if (window.confirm("リンク先のプレビューを有効にしますか？")) {
            prefix = "!"
        }
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
        const is_showing = EmojiPicker.toggle(event.target, shortname => {
            const { textarea } = this.refs
            this.setText(textarea.value + `:${shortname}:`)
        }, () => {
            this.setState({
                "show_emoji_picker": false
            })
        })
        this.setState({
            "show_emoji_picker": is_showing
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
    wrapWithTag = (event, tag, insert_linebreak) => {
        event.preventDefault()
        if (event.target.nodeName === "SPAN") {
            return
        }
        const { textarea } = this.refs
        const text = wrap_with_tag(textarea.value, textarea.selectionStart, textarea.selectionEnd, tag, insert_linebreak)
        this.setText(text)
    }
    onClickActionTextBig = event => {
        this.wrapWithTag(event, config.markdown.big, false)
    }
    onClickActionTextEmphasis = event => {
        this.wrapWithTag(event, config.markdown.emphasis, false)
    }
    onClickActionTextUnderline = event => {
        this.wrapWithTag(event, config.markdown.underline, false)
    }
    onClickActionTextStrikethrough = event => {
        this.wrapWithTag(event, config.markdown.strikethrough, false)
    }
    onClickActionTextItalic = event => {
        this.wrapWithTag(event, config.markdown.italic, false)
    }
    onClickActionTextPre = event => {
        this.wrapWithTag(event, config.markdown.pre, true)
    }
    render() {
        const { logged_in, pinned_media, recent_uploads } = this.props
        if (!!logged_in === false) {
            return (
                <div>投稿するには<a href="/login">ログイン</a>してください</div>
            )
        }

        const { uploader, postbox } = this.props
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
                                    <TooltipButton type="media-upload" handle_click={this.onClickActionMediaUpload} description="アップロード" />
                                    <TooltipButton type="media-history" handle_click={this.onClickActionMediaHistory} description="アップロード履歴" is_active={this.state.show_recent_uploads} />
                                    <TooltipButton type="media-pinned" handle_click={this.onClickActionPinnedMedia} description="よく使う画像" is_active={this.state.show_pinned_media} />
                                </div>
                                <div className="unit">
                                    <TooltipButton type="emoji" handle_click={this.onClickActionEmoji} description="絵文字を入力" is_active={this.state.show_emoji_picker} />
                                    <TooltipButton type="preview" handle_click={this.onClickActionPreview} description="投稿プレビュー" is_active={this.state.show_preview} />
                                    <TooltipButton type="text-editing" handle_click={this.onClickActionText} description="テキストの装飾" is_active={this.state.show_text_actions} />
                                </div>
                                {this.state.show_text_actions ?
                                    <div className="unit">
                                        <TooltipButton type="text-big" handle_click={this.onClickActionTextBig} description="サイズ" />
                                        <TooltipButton type="text-bold" handle_click={this.onClickActionTextEmphasis} description="太字" />
                                        <TooltipButton type="text-underline" handle_click={this.onClickActionTextUnderline} description="下線" />
                                        <TooltipButton type="text-strikethrough" handle_click={this.onClickActionTextStrikethrough} description="打ち消し線" />
                                        <TooltipButton type="text-italic" handle_click={this.onClickActionTextItalic} description="イタリック" />
                                        <TooltipButton type="text-code" handle_click={this.onClickActionTextPre} description="コード" />
                                    </div>
                                    : null
                                }
                            </div>
                            <div className="submit">
                                <button className={classnames("button meiryo", {
                                    "ready user-defined-bg-color": !postbox.is_pending && this.state.is_post_button_active,
                                    "neutral": !postbox.is_pending && !this.state.is_post_button_active,
                                    "in-progress": postbox.is_pending,
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