import { Component } from "react"
import { observable, action } from "mobx"
import { observer } from "mobx-react"
import Router from "next/router"
import ReactCrop, { makeAspectCrop } from "react-image-crop"
import classnames from "classnames"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationbarView from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../views/theme/default/desktop/settings/account/menu"
import { get_category_by_shortname_or_null, EmojiPickerStore } from "../../../../../stores/theme/default/common/emoji"
import { EmojiPickerView } from "../../../../../views/theme/default/desktop/emoji"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import { is_object } from "../../../../../assert"
import Snackbar from "../../../../../views/theme/default/desktop/snackbar"

@observer
class MediaComponent extends Component {
    @observable.shallow selected_media = []
    constructor(props) {
        super(props)
        const { pinned } = props
        this.selected_media_ids = []
        if (Array.isArray(pinned) === false) {
            return
        }
        for (const item of pinned) {
            this.selected_media_ids.push(item.id)
            this.selected_media.push(item)
        }
        this.dragging_media = null

        const pinned_items = []
        for (const item of this.selected_media) {
            pinned_items.push(item)
        }
        this.state = {
            pinned_items
        }
    }
    onSelectImage = (event, item) => {
        event.preventDefault()
        const index = this.selected_media_ids.indexOf(item.id)
        if (index === -1) {
            this.selected_media.push(item)
            this.selected_media_ids.push(item.id)
        } else {
            this.selected_media.splice(index, 1)
            this.selected_media_ids.splice(index, 1)
        }

        const pinned_items = []
        for (const item of this.selected_media) {
            pinned_items.push(item)
        }
        this.setState({
            pinned_items
        })
    }
    onUpdateImage = event => {
        if (this.pending === true) {
            return
        }
        this.pending = true
        request
            .post("/account/favorite/media/update", {
                "media_ids": this.selected_media_ids
            })
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
    onDragStart = (event, item) => {
        this.dragging_media = item
    }
    onDragEnter = (event, item) => {
        event.preventDefault()
    }
    onDragLeave = (event, item) => {
        event.preventDefault()
    }
    onDragOver = (event, item) => {
        event.preventDefault()
    }
    onDragEnd = (event, item) => {
        event.preventDefault()
    }
    onDrop = (event, target_item) => {
        event.preventDefault()
        if (target_item.id === this.dragging_media.id) {
            return true
        }

        const pinned_items = []
        for (const item of this.selected_media) {
            if (item.id === target_item.id) {
                pinned_items.push(this.dragging_media)
            }
            if (item.id === this.dragging_media.id) {
                continue
            }
            pinned_items.push(item)
        }
        const media_ids = []
        this.selected_media = pinned_items
        this.selected_media.forEach(item => {
            media_ids.push(item.id)
        })
        this.selected_media_ids = media_ids
        this.setState({
            pinned_items
        })
    }
    render() {
        const { pinned, history } = this.props
        if (Array.isArray(pinned) === false) {
            return null
        }
        if (Array.isArray(history) === false) {
            return null
        }
        const selectedImageViews = []
        for (const item of this.state.pinned_items) {
            const ext = item.is_image ? item.extension : "jpg"
            const square_src = `${item.uri}/${item.directory}/${item.prefix}.square.${ext}`
            selectedImageViews.push(
                <a draggable="true"
                    className="item"
                    href={item.source}
                    target="_blank"
                    data-media-id={item.id}
                    onDragStart={event => this.onDragStart(event, item)}
                    onDragEnter={event => this.onDragEnter(event, item)}
                    onDragLeave={event => this.onDragLeave(event, item)}
                    onDragOver={event => this.onDragOver(event, item)}
                    onDragEnd={event => this.onDragEnd(event, item)}
                    onDrop={event => this.onDrop(event, item)} >
                    <img className="image" src={square_src} />
                </a >
            )
        }
        const imageCandidateViews = []
        for (const item of history) {
            const index = this.selected_media_ids.indexOf(item.id)
            const active = index !== -1
            const ext = item.is_image ? item.extension : "jpg"
            const square_src = `${item.uri}/${item.directory}/${item.prefix}.square.${ext}`
            imageCandidateViews.push(
                <a className={classnames("item", { active })} href={item.source} onClick={event => this.onSelectImage(event, item)}>
                    <img className="image" src={square_src} />
                    <div className="overlay-bg"></div>
                    <div className={classnames("overlay-fg user-defined-border-color-active", { active })}></div>
                    {index >= 0 ?
                        <span className="number user-defined-bg-color verdana">{index + 1}</span>
                        : null}
                </a>
            )
        }
        return (
            <div className="settings-module pins meiryo">
                <div className="head">
                    <h1>画像</h1>
                </div>

                <div className="description">
                    <p>投稿欄の画像一覧に表示したい画像を選択してください。</p>
                    <p>ドラッグして並べ替えることができます。</p>
                </div>

                <div className="image-selector scroller-wrapper">
                    <div className="list pins scroller">
                        {selectedImageViews}
                    </div>
                    <div className="list candidates scroller">
                        {imageCandidateViews}
                    </div>
                </div>

                <div className="submit">
                    <button className="button user-defined-bg-color" onClick={this.onUpdateImage}>画像を保存</button>
                </div>
            </div>
        )
    }
}

@observer
class EmojiComponent extends Component {
    @observable.shallow selected_emojis = []
    selected_shortnames = []
    constructor(props) {
        super(props)
        const picker = new EmojiPickerStore()
        picker.callback_pick = this.pick
        this.picker = picker
    }
    componentDidMount() {
        const { pinned } = this.props
        if (pinned) {
            for (const shortname of pinned) {
                const category = get_category_by_shortname_or_null(shortname)
                this.selected_emojis.push({ shortname, category })
                this.selected_shortnames.push(shortname)
            }
        }
    }
    pick = (shortname, category) => {
        const emoji = { shortname, category }
        const index = this.selected_shortnames.indexOf(shortname)
        if (index === -1) {
            this.selected_emojis.push(emoji)
            this.selected_shortnames.push(shortname)
        } else {
            this.selected_emojis.splice(index, 1)
            this.selected_shortnames.splice(index, 1)
        }
    }
    onUpdateEmoji = event => {
        if (this.pending === true) {
            return
        }
        this.pending = true
        request
            .post("/account/favorite/emoji/update", {
                "shortnames": this.selected_shortnames
            })
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
        const selectedEmojiView = []
        for (const emoji of this.selected_emojis) {
            const { shortname, category } = emoji
            selectedEmojiView.push(<button onClick={event => this.pick(shortname)} ><i className={`emojipicker-ignore-click emoji-${category} shortname-${shortname}`}></i></button>)
        }
        return (
            <div className="settings-module pins meiryo">
                <div className="head">
                    <h1>絵文字</h1>
                </div>

                <div className="description">
                    絵文字一覧に表示したい絵文字を選択してください。
									</div>

                <div className="emoji-selector scroller-wrapper">
                    <div className="list pins scroller">
                        {selectedEmojiView}
                    </div>
                    <div className="list candidates">
                        <EmojiPickerView picker={this.picker} />
                    </div>
                </div>

                <div className="submit">
                    <button className="button user-defined-bg-color" onClick={this.onUpdateEmoji}>絵文字を保存</button>
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
    render() {
        const { platform, logged_in, pinned_media, recent_uploads, pinned_emoji } = this.props
        if (Array.isArray(pinned_media) === false) {
            return null
        }
        if (Array.isArray(recent_uploads) === false) {
            return null
        }
        if (Array.isArray(pinned_emoji) === false) {
            return null
        }
        return (
            <div id="app" className="settings">
                <Head title={`固定 / 設定 / ${config.site.name}`} platform={platform} logged_in={logged_in} />
                <NavigationbarView logged_in={logged_in} is_bottom_hidden={true} />
                <div className="settings-content">
                    <div className="inside">
                        <SettingsMenuView active="pins" />
                        <div className="settings-content-module">
                            <MediaComponent pinned={pinned_media} history={recent_uploads} />
                            <EmojiComponent pinned={pinned_emoji} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}