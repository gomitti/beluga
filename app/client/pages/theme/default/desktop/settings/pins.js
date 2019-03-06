import { Component } from "react"
import { observable, action } from "mobx"
import { observer } from "mobx-react"
import classnames from "classnames"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuComponent from "../../../../../views/theme/default/desktop/settings/account/menu"
import { get_category_by_shortname_or_null, EmojiPickerStore } from "../../../../../stores/theme/default/common/emoji"
import { EmojiPickerComponent } from "../../../../../views/theme/default/desktop/emoji"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import assert, { is_object, is_array } from "../../../../../assert"
import AppComponent from "../../../../../views/app"
import Toast from "../../../../../views/theme/default/desktop/toast"
import { LoadingButton } from "../../../../../views/theme/default/desktop/button"

const NumberIndicatorComponentOrNull = ({ is_hidden, index }) => {
    if (is_hidden) {
        return null
    }
    return (
        <span className="number user-defined-bg-color verdana">{index}</span>
    )
}

@observer
class MediaComponent extends Component {
    @observable.shallow selected_media = []
    constructor(props) {
        super(props)
        const { pinned, history } = props
        assert(is_array(pinned), "$pinned must be of type array")
        assert(is_array(history), "$history must be of type array")

        this.selected_media_ids = []
        pinned.forEach(item => {
            this.selected_media_ids.push(item.id)
            this.selected_media.push(item)

        })
        this.dragging_media = null

        const pinned_items = []
        this.selected_media.forEach(item => {
            pinned_items.push(item)
        })
        this.state = {
            "in_progress": false,
            "pinned_items": pinned_items
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
        this.selected_media.forEach(item => {
            pinned_items.push(item)
        })
        this.setState({
            pinned_items
        })
    }
    onUpdateImage = event => {
        if (this.state.in_progress === true) {
            return
        }
        this.setState({ "in_progress": true })
        setTimeout(() => {
            request
                .post("/account/favorite/media/update", {
                    "media_ids": this.selected_media_ids
                })
                .then(res => {
                    const { success, error } = res.data
                    if (success == false) {
                        Toast.push(error, false)
                    } else {
                        Toast.push("画像を保存しました", true)
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
        this.selected_media.forEach(item => {
            if (item.id === target_item.id) {
                pinned_items.push(this.dragging_media)
            }
            if (item.id === this.dragging_media.id) {
                return
            }
            pinned_items.push(item)
        })
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
        this.state.pinned_items.forEach(item => {
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
        })
        const imageCandidateViews = []
        history.forEach(item => {
            const index = this.selected_media_ids.indexOf(item.id)
            const active = index !== -1
            const ext = item.is_image ? item.extension : "jpg"
            const square_src = `${item.uri}/${item.directory}/${item.prefix}.square.${ext}`
            imageCandidateViews.push(
                <a className={classnames("item", { active })} href={item.source} onClick={event => this.onSelectImage(event, item)}>
                    <img className="image" src={square_src} />
                    <div className="overlay-bg"></div>
                    <div className={classnames("overlay-fg user-defined-border-color-active", { active })}></div>
                    <NumberIndicatorComponentOrNull is_hidden={index === -1} index={index + 1} />
                </a>
            )
        })
        return (
            <div className="settings-content-component pins meiryo">
                <div className="head">
                    <h1>画像</h1>
                </div>
                <div className="description">
                    <p>投稿欄の画像一覧に表示したい画像を選択してください。</p>
                    <p>ドラッグして並べ替えることができます。</p>
                </div>
                <div className="image-selector scroller-container">
                    <div className="list pins scroller">
                        {selectedImageViews}
                    </div>
                    <div className="list candidates scroller">
                        {imageCandidateViews}
                    </div>
                </div>
                <div className="submit">
                    <LoadingButton
                        handle_click={this.onUpdateImage}
                        is_loading={this.state.in_progress}
                        label="保存する" />
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
        this.state = {
            "in_progress": false
        }
    }
    componentDidMount() {
        const { pinned } = this.props
        if (pinned) {
            pinned.forEach(shortname => {
                const category = get_category_by_shortname_or_null(shortname)
                this.selected_emojis.push({ shortname, category })
                this.selected_shortnames.push(shortname)
            })
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
        if (this.state.in_progress === true) {
            return
        }
        this.setState({ "in_progress": true })
        setTimeout(() => {
            request
                .post("/account/favorite/emoji/update", {
                    "shortnames": this.selected_shortnames
                })
                .then(res => {
                    const { data } = res
                    const { success, error } = data
                    if (success == false) {
                        Toast.push(error, false)
                    } else {
                        Toast.push("絵文字を保存しました", true)
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
        const selectedEmojiView = []
        this.selected_emojis.forEach(emoji => {
            const { shortname } = emoji
            selectedEmojiView.push(<button onClick={event => this.pick(shortname)} ><i className={`emoji-picker-ignore-click emoji-picker-item-image emojione-4 emojione-4-shortname-${shortname}`}></i></button>)
        })
        return (
            <div className="settings-content-component pins meiryo">
                <div className="head">
                    <h1>絵文字</h1>
                </div>

                <div className="description">
                    絵文字一覧に表示したい絵文字を選択してください。
									</div>

                <div className="emoji-selector scroller-container">
                    <div className="list pins scroller">
                        {selectedEmojiView}
                    </div>
                    <div className="list candidates">
                        <EmojiPickerComponent picker={this.picker} />
                    </div>
                </div>

                <div className="submit">
                    <LoadingButton
                        handle_click={this.onUpdateEmoji}
                        is_loading={this.state.in_progress}
                        label="絵文字を保存" />
                </div>
            </div>
        )
    }
}

export default class App extends AppComponent {
    render() {
        const { platform, logged_in_user, pinned_media, recent_uploads, pinned_emoji } = this.props
        return (
            <div className="app settings">
                <Head title={`固定 / 設定 / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} is_bottom_hidden={true} />
                <Toast />
                <div className="client">
                    <div className="inside">
                        <div className="settings-menu-area">
                            <SettingsMenuComponent active_page="pins" />
                        </div>
                        <div className="settings-contents-area">
                            <MediaComponent pinned={pinned_media} history={recent_uploads} />
                            <EmojiComponent pinned={pinned_emoji} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}