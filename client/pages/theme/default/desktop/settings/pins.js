import { Component } from "react"
import { observable, action } from "mobx"
import { observer } from "mobx-react"
import ReactCrop, { makeAspectCrop } from "react-image-crop"
import classnames from "classnames"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../views/theme/default/desktop/settings/account/menu"
import { get_category_from_shortname } from "../../../../../stores/emoji"
import { EmojiPickerView } from "../../../../../views/theme/default/desktop/emoji"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"

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
                    alert("保存しました")
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
        const { pinned, history } = this.props
        if (Array.isArray(pinned) === false) {
            return null
        }
        if (Array.isArray(history) === false) {
            return null
        }
        const selectedImageViews = []
        for (const item of this.selected_media) {
            const ext = item.is_image ? item.extension : "jpg"
            const square_src = `${item.uri}/${item.directory}/${item.prefix}.square.${ext}`
            selectedImageViews.push(<a className="item" href={item.source} target="_blank"><img className="image" src={square_src} /></a>)
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
                    {(() => {
                        if (index >= 0) {
                            return <span className="number user-defined-bg-color verdana">{index + 1}</span>
                        }
                    })()}
                </a>
            )
        }
        return (
            <div className="settings-module bookmark meiryo">
                <div className="head">
                    <h1>画像</h1>
                </div>

                <div className="description">
                    投稿欄の画像一覧に表示したい画像を選択してください。
								</div>

                <div className="image-selector scroller-wrapper">
                    <div className="list bookmarks scroller">
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
    componentDidMount() {
        const { pinned } = this.props
        if (pinned) {
            for (const shortname of pinned) {
                const category = get_category_from_shortname(shortname)
                this.selected_emojis.push({ shortname, category })
                this.selected_shortnames.push(shortname)
            }
        }
    }
    pick = (shortname) => {
        const category = get_category_from_shortname(shortname)
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
                    alert("保存しました")
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
            <div className="settings-module bookmark meiryo">
                <div className="head">
                    <h1>絵文字</h1>
                </div>

                <div className="description">
                    絵文字一覧に表示したい絵文字を選択してください。
									</div>

                <div className="emoji-selector scroller-wrapper">
                    <div className="list bookmarks scroller">
                        {selectedEmojiView}
                    </div>
                    <div className="list candidates">
                        <EmojiPickerView pick={this.pick} />
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
                <NavigationBarView logged_in={logged_in} is_bottom_hidden={true} />
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