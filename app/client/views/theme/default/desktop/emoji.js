import { Component } from "react"
import classnames from "classnames"
import { observer } from "mobx-react"
import { observable, action } from "mobx"
import assert, { is_string, is_object, is_array } from "../../../../assert"
import { get_category_by_shortname_or_null, get_all_categories, get_title_by_category, get_shortnames_by_category, search_by_shortname, get_image_url_by_shortname_or_null, EmojiPickerStore } from "../../../../stores/theme/default/common/emoji"
import { get_shared_picker_store } from "../../../../stores/theme/default/common/emoji"

@observer
class EmojiListView extends Component {
    render() {
        const { emojis, handle_pick, title, category, server, is_hidden } = this.props
        if (is_hidden) {
            return null
        }
        if (!!emojis === false) {
            return null
        }
        if (emojis.length === 0) {
            return null
        }
        const buttons = []
        emojis.forEach(emoji => {
            const { shortname, category } = emoji
            if (category === "custom") {
                buttons.push(
                    <button
                        key={shortname}
                        onClick={event => handle_pick(shortname, category)}
                        className="emoji-picker-ignore-click" >
                        <img className={`emoji-picker-ignore-click emoji-picker-item-image`}
                            src={get_image_url_by_shortname_or_null(shortname, server.id)} />
                    </button>
                )
            } else {
                buttons.push(
                    <button
                        key={shortname}
                        onClick={event => handle_pick(shortname, category)}
                        className="emoji-picker-ignore-click" >
                        <i className={`emoji-picker-ignore-click emoji-picker-item-image emojione-4 emojione-4-shortname-${shortname}`}>
                        </i>
                    </button>
                )
            }
        })
        return (
            <div className={`emoji-category ${category}`}>
                <header className="header">{title}</header>
                <div className="buttons">
                    {buttons}
                </div>
            </div>
        )
    }
}

class EmojiSearchListView extends Component {
    render() {
        const { emojis, server, is_hidden, handle_pick } = this.props
        return (
            <div className={classnames("categories scroller", { "hidden": is_hidden })} ref="categories">
                <EmojiListView emojis={emojis} server={server} handle_pick={handle_pick} title="検索" category="search" />
            </div>
        )
    }
}

class EmojiDefaultListView extends Component {
    constructor(props) {
        super(props)
        const { pinned_shortnames, custom_shortnames, current_category, handle_pick } = props

        this.prev_category = current_category
        this.map_category_dom = null

        this.categoryViews = []
        const categories = get_all_categories()
        categories.forEach(category => {
            const shortnames = get_shortnames_by_category(category)
            const title = get_title_by_category(category)
            const buttons = []
            shortnames.forEach(shortname => {
                buttons.push(
                    <button
                        key={shortname}
                        onClick={event => {
                            event.preventDefault()
                            handle_pick(shortname, category)
                        }}
                        className="emoji-picker-ignore-click" >
                        <i className={`emoji-picker-ignore-click emoji-picker-item-image emojione-4 emojione-4-shortname-${shortname}`}></i>
                    </button>
                )
            })
            this.categoryViews.push(
                <div key={category} className={`emoji-category ${category}`}>
                    <header className="header">{title}</header>
                    <div className="buttons">
                        {buttons}
                    </div>
                </div>
            )
        })

        this.pinned_emojis = []
        if (Array.isArray(pinned_shortnames)) {
            pinned_shortnames.forEach(shortname => {
                const category = get_category_by_shortname_or_null(shortname)
                if (category === null) {
                    return
                }
                this.pinned_emojis.push({ shortname, category })
            })
        }

        this.custom_emojis = []
        if (Array.isArray(custom_shortnames)) {
            custom_shortnames.forEach(shortname => {
                const category = "custom"
                this.custom_emojis.push({ shortname, category })
            })
        }
    }
    componentDidMount() {
        this.map_category_dom = {}
        const dom = this.refs.categories
        assert(!!dom, "$dom is null")
        const category_doms = dom.getElementsByClassName("emoji-category")
        Array.prototype.forEach.call(category_doms, dom => {
            const category = dom.className.split(" ")[1]
            assert(is_string(category), "$category must be of type string")
            this.map_category_dom[category] = dom
        })
    }
    render() {
        const { current_category, server, history_emojis, handle_pick } = this.props
        if (this.map_category_dom) {
            if (current_category !== this.prev_category) {
                const target = this.map_category_dom[current_category]
                if (target) {
                    this.refs.categories.scrollTop = target.offsetTop
                }
                this.prev_category = current_category
            }
        }
        const { is_hidden } = this.props
        return (
            <div className={classnames("categories scroller webkit-scrollbar", { "hidden": is_hidden })} ref="categories">
                <EmojiListView
                    emojis={this.pinned_emojis}
                    handle_pick={handle_pick}
                    title="よく使う絵文字"
                    category="pinned"
                    is_hidden={(this.pinned_emojis.length === 0)} />
                <EmojiListView
                    emojis={history_emojis}
                    server={server}
                    handle_pick={handle_pick}
                    title="履歴"
                    category="history"
                    is_hidden={!server} />
                <EmojiListView
                    emojis={this.custom_emojis}
                    server={server}
                    handle_pick={handle_pick}
                    title="カスタム"
                    category="custom"
                    is_hidden={(server && this.custom_emojis.length === 0)} />
                {this.categoryViews}
            </div>
        )
    }
}

@observer
export class EmojiPickerView extends Component {
    constructor(props) {
        super(props)
        const { picker } = props
        assert(picker instanceof EmojiPickerStore, "$picker must be an instance of EmojiPickerStore")
        this.state = {
            "search_result": []
        }
        this.search_timer_id = null
        if (typeof window !== "undefined") {
            window.addEventListener(event_types.window_did_update, () => {
                const { search_input } = this.refs
                const { picker } = this.props
                search_input.value = ""
                if (picker.is_active) {
                    search_input.focus()
                }
            })
        }
    }
    onClickMenuItem = (event, category) => {
        event.preventDefault()
        const { picker } = this.props
        picker.setCurrentCategory(category)
    }
    onSearchInputChange = event => {
        const input = this.refs.search_input
        const { picker } = this.props
        const text = input.value
        if (text.length == 0) {
            return picker.setIsSearching(false)
        }
        picker.setIsSearching(true)
        clearTimeout(this.search_timer_id)
        this.search_timer_id = setTimeout(() => {
            const emojis = search_by_shortname(text)
            this.setState({
                "search_result": emojis
            })
        }, 100)
    }
    onPick = (shortname, category) => {
        const { picker } = this.props
        if (!!picker === false) {
            return
        }
        picker.pick(shortname, category)
    }
    render() {
        console.log("[emoji picker] render")
        const { picker, server, pinned_shortnames, custom_shortnames } = this.props

        const categories = get_all_categories()
        categories.unshift("history")
        categories.unshift("pinned")

        const menuViews = []
        categories.forEach(category => {
            menuViews.push(
                <button
                    className={classnames(`${category} item user-defined-color-active user-defined-border-color-active emoji-picker-ignore-click`, { "active": category === picker.current_category })}
                    onClick={event => this.onClickMenuItem(event, category)}>
                </button>
            )
        })
        return (
            <div className="emoji-picker-component scroller-container emoji-picker-ignore-click">
                <div className="menu emoji-picker-ignore-click">
                    {menuViews}
                </div>
                <div className="search-area emoji-picker-ignore-click">
                    <input type="text" ref="search_input" placeholder="検索" class="form-input emoji-picker-ignore-click" onChange={this.onSearchInputChange} />
                    <a className="close-button" href="#" onClick={event => {
                        event.preventDefault()
                        EmojiPicker.hide()
                    }}>閉じる</a>
                </div>
                <EmojiSearchListView
                    is_hidden={!picker.is_searching}
                    handle_pick={this.onPick}
                    server={server}
                    emojis={this.state.search_result} />
                <EmojiDefaultListView
                    is_hidden={picker.is_searching}
                    current_category={picker.current_category}
                    handle_pick={this.onPick}
                    pinned_shortnames={pinned_shortnames}
                    custom_shortnames={custom_shortnames}
                    history_emojis={picker.getEmojiHistory()}
                    server={server} />
            </div>
        )
    }
}

const event_types = {
    "show": "__event_emoji_picker_show",
    "toggle": "__event_emoji_picker_toggle",
    "hide": "__event_emoji_picker_hide",
    "window_did_update": "__event_emoji_picker_window_did_update",
}

const dispatch_event = (eventName, opts) => {
    if (typeof window === "undefined") {
        return
    }
    let event
    if (typeof window.CustomEvent === "function") {
        event = new window.CustomEvent(eventName, { "detail": opts })
    } else {
        event = document.createEvent("Event")
        event.initEvent(eventName, false, true)
        event.detail = opts
    }
    window.dispatchEvent(event)
}

const register_methods = target => {
    target.show = (dom, callback_pick, callback_hide) => {
        dispatch_event(event_types.show, { dom, callback_pick, callback_hide })
    }
    target.toggle = (dom, callback_pick, callback_hide) => {
        dispatch_event(event_types.toggle, { dom, callback_pick, callback_hide })
    }
    target.hide = () => {
        dispatch_event(event_types.hide, {})
    }
}

@observer
class EmojiPickerWindowComponent extends Component {
    constructor(props) {
        super(props)
        const { picker } = props

        this.state = {
            "top": 0,
            "left": 0
        }
        this.is_shift_key_down = false
        this.prev_dom = null

        if (typeof window !== "undefined") {
            window.addEventListener(event_types.show, this.show)
            window.addEventListener(event_types.hide, this.hide)
            window.addEventListener(event_types.toggle, this.toggle)
            window.addEventListener("resize", this.hide)
            window.addEventListener("scroll", this.hide)
            window.addEventListener("keyup", this.onKeyUp)
            window.addEventListener("keydown", this.onKeyDown)
            document.body.addEventListener("click", this.onClick)
        }
    }
    onClick = event => {
        const { target } = event
        if (!!target === false) {
            this.hide()
            return true
        }
        if (is_string(target.className) && target.className.indexOf("emoji-picker-ignore-click") !== -1) {
            return true
        }
        this.hide()
    }
    onKeyUp = event => {
        if (event.keyCode == 16) {
            this.is_shift_key_down = false
        }
    }
    onKeyDown = event => {
        if (event.keyCode == 16) {
            this.is_shift_key_down = true
        }
    }
    show = payload => {
        const { picker } = this.props
        const { detail } = payload
        const { dom, callback_pick, callback_hide } = detail
        let { x, y } = dom.getBoundingClientRect()

        const { component } = this.refs
        const { body } = document

        const padding = 10
        const width = component.clientWidth
        const height = component.clientHeight
        if (x + width + padding > body.clientWidth) {
            x = body.clientWidth - width - padding
        }
        console.log(x, y, height, padding)
        console.log(window.innerHeight, window.pageYOffset)
        if (y + height + padding > window.innerHeight + window.pageYOffset) {
            y = window.innerHeight + window.pageYOffset - height - padding
        }

        this.setState({
            "left": x,
            "top": y
        })
        picker.show((shortname, category) => {
            callback_pick(shortname, category)
            if (this.is_shift_key_down === false) {
                picker.hide()
            }
        }, callback_hide)
    }
    toggle = payload => {
        const { detail } = payload
        const { dom } = detail
        const { picker } = this.props
        if (dom !== this.prev_dom) {
            this.show(payload)
        } else {
            if (picker.is_active) {
                this.hide()
            } else {
                this.show(payload)
            }
        }
        this.prev_dom = dom
    }
    hide = () => {
        const { picker } = this.props
        picker.hide()
    }
    componentDidUpdate = (prevProps, prevState, snapshot) => {
        dispatch_event(event_types.window_did_update)
    }
    render() {
        const { picker, pinned_shortnames, custom_shortnames, server } = this.props
        if (picker === null) {
            return null
        }
        return (
            <div className={classnames("emoji-picker-window-component", {
                "hidden": !picker.is_active
            })}
                ref="component"
                style={{
                    "top": this.state.top,
                    "left": this.state.left
                }}>
                <EmojiPickerView
                    picker={picker}
                    server={server}
                    pinned_shortnames={pinned_shortnames}
                    custom_shortnames={custom_shortnames} />
            </div>
        )
    }
}

@register_methods
class EmojiPicker extends Component {
    constructor(props) {
        super(props)
        this.picker = null
        if (typeof window !== "undefined") {
            const { server } = props
            this.picker = get_shared_picker_store(server)
        }
    }
    render() {
        const { pinned_shortnames, custom_shortnames, server } = this.props
        return (
            <div>
                <EmojiPickerWindowComponent
                    pinned_shortnames={pinned_shortnames}
                    custom_shortnames={custom_shortnames}
                    picker={this.picker}
                    server={server} />
            </div>

        )
    }
}

export default EmojiPicker