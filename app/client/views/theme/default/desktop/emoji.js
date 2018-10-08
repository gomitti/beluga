import { Component } from "react"
import classnames from "classnames"
import { observer } from "mobx-react"
import { observable, action } from "mobx"
import assert, { is_string, is_object, is_array } from "../../../../assert"
import { get_category_by_shortname_or_null, get_all_categories, get_title_by_category, get_shortnames_by_category, search_by_shortname, get_image_url_by_shortname_or_null } from "../../../../stores/theme/default/common/emoji"
import { get_shared_picker_store } from "../../../../stores/theme/default/common/emoji"

@observer
class EmojiListView extends Component {
    render() {
        const { emojis, handle_pick, title, category, server } = this.props
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
                        onClick={event => handle_pick(shortname, category)}
                        className="emojipicker-ignore-click" >
                        <img className={`emojipicker-ignore-click emoji-${category} shortname-${shortname}`}
                            src={get_image_url_by_shortname_or_null(shortname, server.id)} />
                    </button>
                )
            } else {
                buttons.push(
                    <button
                        onClick={event => handle_pick(shortname, category)}
                        className="emojipicker-ignore-click" >
                        <i className={`emojipicker-ignore-click emoji-${category} shortname-${shortname}`}>
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
                    <button onClick={event => {
                        event.preventDefault()
                        handle_pick(shortname, category)
                    }}
                        className="emojipicker-ignore-click" >
                        <i className={`emojipicker-ignore-click emoji-${category} shortname-${shortname}`}></i>
                    </button>
                )
            })
            this.categoryViews.push(
                <div className={`emoji-category ${category}`}>
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
            <div className={classnames("categories scroller", { "hidden": is_hidden })} ref="categories">
                {this.pinned_emojis.length === 0 ? null :
                    <EmojiListView
                        emojis={this.pinned_emojis}
                        handle_pick={handle_pick}
                        title="よく使う絵文字"
                        category="pinned" />
                }
                {server ?
                    <EmojiListView
                        emojis={history_emojis}
                        server={server}
                        handle_pick={handle_pick}
                        title="履歴"
                        category="history" />
                    : null
                }
                {(server && this.custom_emojis.length === 0) ? null :
                    <EmojiListView
                        emojis={this.custom_emojis}
                        server={server}
                        handle_pick={handle_pick}
                        title="カスタム"
                        category="custom" />
                }
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
        this.state = {
            "search_result": []
        }
        this.search_timer_id = null
    }
    onClickMenuItem = (event, category) => {
        event.preventDefault()
        const { picker } = this.props
        picker.set_current_category(category)
    }
    onSearchInputChange = event => {
        const input = this.refs.search_input
        const { picker } = this.props
        assert(!!input, "$input is null")
        const text = input.value
        if (text.length == 0) {
            return picker.set_is_searching(false)
        }
        picker.set_is_searching(true)
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
    shouldComponentUpdate = () => {
        const { picker } = this.props
        if (picker.is_searching === false) {
            this.refs.search_input.value = ""
        }
        return true
    }
    render() {
        const { picker, server, pinned_shortnames, custom_shortnames } = this.props

        const categories = get_all_categories()
        categories.unshift("history")
        categories.unshift("pinned")

        const menuViews = []
        categories.forEach(category => {
            menuViews.push(
                <button
                    className={classnames(`${category} item user-defined-color-active user-defined-border-color-active emojipicker-ignore-click`, { "active": category === picker.current_category })}
                    onClick={event => this.onClickMenuItem(event, category)}>
                </button>
            )
        })
        return (
            <div className="emoji-picker scroller-wrapper emojipicker-ignore-click">
                <div className="menu emojipicker-ignore-click">
                    {menuViews}
                </div>
                <div className="search emojipicker-ignore-click">
                    <input type="text" ref="search_input" placeholder="検索" class="form-input emojipicker-ignore-click" onChange={this.onSearchInputChange} />
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
                    history_emojis={picker.get_emoji_history()}
                    server={server} />
            </div>
        )
    }
}

const event_types = {
    "show": "__event_emojipicker_show",
    "toggle": "__event_emojipicker_toggle",
    "hide": "__event_emojipicker_hide",
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

@register_methods
class EmojiPicker extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "available": false,
            "is_hidden": true,
            "top": 0,
            "left": 0
        }
        this.picker = null
        if (typeof window !== "undefined") {
            window.removeEventListener(event_types.show, this.show)
            window.addEventListener(event_types.show, this.show, false)
            window.removeEventListener(event_types.hide, this.hide)
            window.addEventListener(event_types.hide, this.hide, false)
            window.removeEventListener(event_types.toggle, this.toggle)
            window.addEventListener(event_types.toggle, this.toggle, false)
            window.removeEventListener("resize", this.hide)
            window.addEventListener("resize", this.hide, false)
            window.addEventListener("scroll", this.hide, false)
            document.body.addEventListener("click", event => {
                const { target } = event
                if (!!target === false) {
                    this.hide()
                    return true
                }
                if (is_string(target.className) && target.className.indexOf("emojipicker-ignore-click") !== -1) {
                    return true
                }
                this.hide()
            })
            this.state.available = true
            const { server } = props
            this.picker = get_shared_picker_store(server)
        }
    }
    show = payload => {
        if (this.state.is_hidden === false) {
            return
        }
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
            "is_hidden": false,
            "left": x,
            "top": y
        })
        this.picker.show(callback_pick, callback_hide)
    }
    toggle = payload => {
        if (this.state.is_hidden) {
            this.show(payload)
            return true
        } else {
            this.hide()
            return false
        }
    }
    hide = () => {
        if (this.state.is_hidden) {
            return
        }
        this.setState({
            "is_hidden": true,
        })
        this.picker.hide()
    }
    render() {
        const empty = (
            <div className={classnames("emoji-module", {
                "hidden": this.state.is_hidden
            })}
                ref="component"
                style={{
                    "top": this.state.top,
                    "left": this.state.left
                }}>
            </div>
        )
        if (this.state.available === false) {
            return empty
        }
        const { pinned_shortnames, custom_shortnames, server } = this.props
        return (
            <div className={classnames("emoji-module", {
                "hidden": this.state.is_hidden
            })}
                ref="component"
                style={{
                    "top": this.state.top,
                    "left": this.state.left
                }}>
                <EmojiPickerView
                    picker={this.picker}
                    server={server}
                    pinned_shortnames={pinned_shortnames}
                    custom_shortnames={custom_shortnames} />
            </div>
        )
    }
}

export default EmojiPicker