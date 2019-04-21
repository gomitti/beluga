import { Component, Fragment } from "react"
import classnames from "classnames"
import { observer } from "../../../../stores/theme/default/common/mobx"
import assert, { is_string, is_object, is_array } from "../../../../assert"
import * as EmojiPickerStore from "../../../../stores/theme/default/common/emoji"

const ShortnameListComponent = ({ category, handle_pick }) => {
    const { emojis, name } = category
    if (emojis.length === 0) {
        return (
            <div className={`emoji-category ${name}`}></div>
        )
    }
    const buttons = []
    emojis.forEach(emoji => {
        const { shortname, is_custom, image_url } = emoji
        if (is_custom) {
            buttons.push(
                <button
                    key={shortname}
                    onClick={event => handle_pick(shortname)}
                    className="emoji-picker-ignore-click item">
                    <span className={`emoji-picker-ignore-click emoji-picker-item-image emoji-sizer`}
                        style={{ "backgroundImage": `url(${image_url})` }}></span>
                </button>
            )
        } else {
            buttons.push(
                <button
                    key={shortname}
                    onClick={event => handle_pick(shortname)}
                    className="emoji-picker-ignore-click item">
                    <span className={`emoji-picker-ignore-click emoji-picker-item-image emojione-4 emojione-4-shortname-${shortname}`}></span>
                </button>
            )
        }
    })
    const description = EmojiPickerStore.get_description_by_category_name(name)
    return (
        <div className={`emoji-category ${name}`}>
            <header className="header">{description}</header>
            <div className="button-grid">
                {buttons}
            </div>
        </div>
    )
}

@observer
class CategoryShortnamesComponent extends Component {
    render() {
        console.log("[CategoryShortnamesComponent] render()")
        const { categories, handle_pick } = this.props
        const components = []
        categories.forEach(category_store => {
            const { emojis, category_name } = category_store
            components.push(
                <ShortnameListComponent
                    key={category_name}
                    category={category_store}
                    handle_pick={handle_pick} />
            )
        })
        return (
            <Fragment>{components}</Fragment>
        )
    }
}

@observer
export class CategoryScrollerComponent extends Component {
    render() {
        const { is_searching, handle_pick } = this.props
        const picker = EmojiPickerStore.shared_instance
        if (is_searching) {
            return (
                <Fragment>
                    <CategoryShortnamesComponent categories={picker.search_emoji.categories} handle_pick={handle_pick} />
                </Fragment>
            )
        }
        return (
            <Fragment>
                <CategoryShortnamesComponent categories={picker.pinned_emoji.categories} handle_pick={handle_pick} />
                <CategoryShortnamesComponent categories={picker.history_emoji.categories} handle_pick={handle_pick} />
                <CategoryShortnamesComponent categories={picker.standard_emoji.categories} handle_pick={handle_pick} />
                <CategoryShortnamesComponent categories={picker.custom_emoji.categories} handle_pick={handle_pick} />
            </Fragment>
        )
    }
}

export class EmojiPickerBaseComponent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "search_result": [],
            "is_searching": false,
            "current_category_name": "pinned"
        }
        this.search_timer_id = null
        this.category_dom_by_name = {}

        if (typeof window !== "undefined") {
            window.addEventListener(event_types.reset_state, () => {
                const { search_input } = this.refs
                this.setState({
                    "current_category_name": "pinned",
                    "is_searching": false
                })
                setTimeout(() => {
                    search_input.value = ""
                    this.refs.categories.scrollTop = 0
                }, 100)
            })
            window.addEventListener(event_types.focus_input, () => {
                setTimeout(() => {
                    const { search_input } = this.refs
                    search_input.focus()
                }, 100)
            })
        }
    }
    componentDidUpdate = (prevProps, prevState) => {
        const dom = this.refs.categories
        if (!!dom === false) {
            return
        }
        console.log("[EmojiPickerBaseComponent] componentDidUpdate()")
        const category_doms = dom.getElementsByClassName("emoji-category")
        Array.prototype.forEach.call(category_doms, dom => {
            const category_name = dom.className.split(" ")[1]
            assert(is_string(category_name), "$category_name must be of type string")
            this.category_dom_by_name[category_name] = dom
        })
    }
    onClickMenuItem = (event, category_name) => {
        event.preventDefault()
        const target = this.category_dom_by_name[category_name]
        console.log("target", target)
        if (target) {
            this.refs.categories.scrollTop = target.offsetTop
        }
        this.setState({
            "current_category_name": category_name
        })
    }
    onSearchInputChange = event => {
        const input = this.refs.search_input
        const picker = EmojiPickerStore.shared_instance
        const query = input.value
        if (query.length == 0) {
            return this.setState({
                "is_searching": false
            })
        }
        clearTimeout(this.search_timer_id)
        this.search_timer_id = setTimeout(() => {
            this.setState({
                "is_searching": true
            })
            picker.searchByShortname(query)
        }, 100)
    }
    render() {
        const { pinned_shortnames, handle_pick } = this.props
        console.log("[EmojiPickerBaseComponent] render()")

        const category_name_list = EmojiPickerStore.get_all_category_names()
        const menu_components = []
        category_name_list.forEach(category_name => {
            menu_components.push(
                <button
                    key={category_name}
                    className={classnames(`${category_name} item user-defined-color-active user-defined-border-color-active emoji-picker-ignore-click`, {
                        "active": category_name === this.state.current_category_name
                    })}
                    onClick={event => this.onClickMenuItem(event, category_name)}>
                </button>
            )
        })

        return (
            <div className="emoji-picker-component scroller-container emoji-picker-ignore-click">
                <div className="menu-area emoji-picker-ignore-click">
                    <div className="inside">
                        {menu_components}
                    </div>
                </div>
                <div className="search-area emoji-picker-ignore-click">
                    <input type="text" ref="search_input" placeholder="検索" class="form-input emoji-picker-ignore-click" onChange={this.onSearchInputChange} />
                    <a className="close-button" href="#" onClick={event => {
                        event.preventDefault()
                        EmojiPicker.hide()
                    }}>閉じる</a>
                </div>
                <div className="categories scroller webkit-scrollbar" ref="categories">
                    <CategoryScrollerComponent is_searching={this.state.is_searching} handle_pick={handle_pick} />
                </div>
            </div>
        )
    }
}

export const event_types = {
    "show": "__event_emoji_picker_show",
    "toggle": "__event_emoji_picker_toggle",
    "hide": "__event_emoji_picker_hide",
    "window_did_update": "__event_emoji_picker_window_did_update",
    "reset_state": "__event_emoji_picker_reset_state",
    "focus_input": "__event_emoji_picker_focus_input",
}

export const dispatch_event = (eventName, opts) => {
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
    target.show = (dom, community, callback_pick, callback_hide) => {
        const picker = EmojiPickerStore.shared_instance
        if (community) {
            picker.setCommunityId(community.id)
        } else {
            picker.setCommunityId(null)
        }
        dispatch_event(event_types.show, { dom, callback_pick, callback_hide })
    }
    target.toggle = (dom, community, callback_pick, callback_hide) => {
        const picker = EmojiPickerStore.shared_instance
        if (community) {
            picker.setCommunityId(community.id)
        } else {
            picker.setCommunityId(null)
        }
        dispatch_event(event_types.toggle, { dom, community, callback_pick, callback_hide })
    }
    target.hide = () => {
        dispatch_event(event_types.hide, {})
    }
}

class EmojiPickerWindowComponent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "top": 0,
            "left": 0,
            "is_hidden": true
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
            document.body.addEventListener("click", this.onClickDocument)
        }
    }
    onClickDocument = event => {
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
            console.log("shift key up")
            this.is_shift_key_down = false
        }
    }
    onKeyDown = event => {
        if (event.keyCode == 16) {
            console.log("shift key down")
            this.is_shift_key_down = true
        }
    }
    show = payload => {
        const { detail } = payload
        const { dom, callback_pick, callback_hide } = detail
        const target_rect = dom.getBoundingClientRect()
        const target_x = target_rect.x
        const target_y = target_rect.y
        let x = target_x
        let y = target_y + 40

        const picker_width = 366
        const picker_height = 320

        const { body } = document

        // マルチカラム時の横スクロール量
        let offset_left = 0
        let offset_top = 0
        const base = document.getElementsByClassName("emoji-picker-offset-base")
        if (base.length == 1) {
            const offset = base[0].getBoundingClientRect()
            offset_left += offset.left
            offset_top += offset.top
        }
        const page_height = document.getElementsByClassName("app")[0].clientHeight

        const padding = 10
        // console.log("x", x, "picker_width", picker_width, "body.clientWidth", body.clientWidth)
        // console.log("x + picker_width + padding", x + picker_width + padding)
        // 画面右端にはみ出た場合
        if (x + picker_width + padding > body.clientWidth) {
            x = body.clientWidth - picker_width - padding
            // console.log("adjust x")
        }
        // console.log("x", x, "target_x", target_x)

        // console.log("y", y, "target_y", target_y)
        if (y + picker_height + padding > window.innerHeight) {
            y = window.innerHeight - picker_height - padding
            // console.log("adjust y")
        }
        // console.log("y", y, "target_y", target_y)
        // 画面下にはみ出た場合
        if (y < target_y && y + picker_height > target_y) {
            y = target_y - picker_height - padding
            // console.log("adjust y")
        }
        // console.log("y", y, "target_y", target_y)

        this.setState({
            "left": x - offset_left,
            "top": y + window.pageYOffset,
            "is_hidden": false,
            "callback_pick": callback_pick,
            "callback_hide": callback_hide
        })
        dispatch_event(event_types.focus_input, null)
    }
    toggle = payload => {
        const { detail } = payload
        const { dom } = detail
        if (dom !== this.prev_dom) {
            this.show(payload)
        } else {
            if (this.state.is_hidden) {
                this.show(payload)
            } else {
                this.hide()
            }
        }
        this.prev_dom = dom
    }
    hide = () => {
        this.setState({
            "is_hidden": true
        })
        const { callback_hide } = this.state
        if (callback_hide) {
            callback_hide()
        }
        dispatch_event(event_types.reset_state, null)
    }
    componentDidUpdate = (prevProps, prevState, snapshot) => {
        console.log("[EmojiPickerWindowComponent] componentDidUpdate()")
        // dispatch_event(event_types.window_did_update)
    }
    onPick = shortname => {
        const { callback_pick } = this.state
        if (callback_pick) {
            callback_pick(shortname)
        }
        const picker = EmojiPickerStore.shared_instance
        picker.shortnameDidPick(shortname)
        if (this.is_shift_key_down === false) {
            EmojiPicker.hide()
        }
    }
    render() {
        console.log("[EmojiPickerWindowComponent] render()")
        return (
            <div className={classnames("emoji-picker-window-component", {
                "invisible": this.state.is_hidden
            })}
                style={{
                    "top": this.state.top,
                    "left": this.state.left,
                    "width": "366px",
                    "height": "320px"
                }}>
                <EmojiPickerBaseComponent is_hidden={this.state.is_hidden} handle_pick={this.onPick} />
            </div>
        )
    }
}

@register_methods
class EmojiPicker extends Component {
    render() {
        return (
            <div>
                <EmojiPickerWindowComponent />
            </div>

        )
    }
}

export default EmojiPicker