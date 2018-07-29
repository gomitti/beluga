import { Component } from "react"
import classnames from "classnames"
import { observer } from "mobx-react"
import { observable, action } from "mobx"
import config from "../../../../beluga.config"
import assert, { is_string, is_object } from "../../../../assert"
import { map_category_ids, map_id_shortname, map_category_title, get_category_from_shortname } from "../../../../stores/emoji"

class EmojiHistoryStore {
    @observable.shallow list = []
    constructor(server) {
        if (!!server === false) {
            return
        }
        assert(is_object(server), "@server must be of type object")
        this.server = server

        const history_str = localStorage.getItem(`emoji.history.${server.id}`)
        if (!!history_str == false) {
            return
        }
        const shortnames = JSON.parse(history_str)
        if (Array.isArray(shortnames) === false) {
            return
        }
        if (shortnames.length > 0) {
            for (const emoji of shortnames) {
                const { shortname, category } = emoji
                this.list.push({
                    shortname, category
                })
            }
        }
    }
    @action.bound
    add(shortname, category) {
        assert(is_string(shortname))
        assert(is_string(category))
        const list = []
        for (const item of this.list) {
            if (shortname === item.shortname) {
                continue
            }
            list.push(item)
        }
        list.unshift({ shortname, category })
        if (list.length > config.emoji.history.capacity) {
            list.pop()
        }
        this.list = list
        localStorage.setItem(`emoji.history.${this.server.id}`, JSON.stringify(list))
    }
}

export class EmojiPickerStore {
    @observable top = 0
    @observable left = 0
    @observable is_hidden = true
    @observable.shallow history = null
    constructor(server) {
        if (server) {
            this.server = server
            this.history = new EmojiHistoryStore(server)
        }
    }
    @action.bound
    show = (left, top, callback_pick, callback_hide) => {
        this.top = top
        this.left = left
        this.callback_pick = callback_pick
        this.callback_hide = callback_hide
        this.is_hidden = false
    }
    @action.bound
    hide = () => {
        this.is_hidden = true
        if (this.callback_hide) {
            this.callback_hide()
        }
        this.callback_pick = null
        this.callback_hide = null
    }
    pick = (shortname, category) => {
        if (this.history) {
            this.history.add(shortname, category)
        }
        if (this.callback_pick) {
            this.callback_pick(shortname, category)
        }
    }
    get_emoji_history = () => {
        if (this.history) {
            return this.history.list
        }
        return []
    }
}

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
        console.log(emojis)
        const buttons = []
        for (const emoji of emojis) {
            const { shortname, category } = emoji
            if (category === "custom") {
                buttons.push(
                    <button
                        onClick={event => handle_pick(shortname, category)}
                        className="emojipicker-ignore-click" >
                        <img className={`emojipicker-ignore-click emoji-${category} shortname-${shortname}`}
                            src={`/asset/emoji/shortnames/${server.id}/${shortname}`} />
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
        }
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

@observer
export class EmojiPickerView extends Component {
    constructor(props) {
        super(props)
        const { picker } = props
        this.state = {
            "current_category": "pinned"
        }
        this.categoryViews = []
        for (const category of Object.keys(map_category_ids)) {
            const ids = map_category_ids[category]
            const title = map_category_title[category]
            const buttons = []
            for (const id of ids) {
                const shortname = map_id_shortname[id]
                if (!!shortname == false) {
                    throw new Error(`絵文字${id}が見つかりません`)
                }
                buttons.push(
                    <button onClick={event => this.onPick(shortname, category)}
                        className="emojipicker-ignore-click" >
                        <i className={`emojipicker-ignore-click emoji-${category} shortname-${shortname}`}></i>
                    </button>
                )
            }
            this.categoryViews.push(
                <div className={`emoji-category ${category}`}>
                    <header className="header">{title}</header>
                    <div className="buttons">
                        {buttons}
                    </div>
                </div>
            )
        }

        const { pinned } = props
        this.pinned_emojis = []
        if (Array.isArray(pinned)) {
            for (const shortname of pinned) {
                const category = get_category_from_shortname(shortname)
                if (category === null) {
                    continue
                }
                this.pinned_emojis.push({ shortname, category })
            }
        }

        const { custom } = props
        this.custom_emojis = []
        if (Array.isArray(custom)) {
            for (const shortname of custom) {
                const category = "custom"
                this.custom_emojis.push({ shortname, category })
            }
        }
    }
    componentDidMount() {
        this.map_category_dom = {}
        const dom = this.refs.categories
        const category_doms = dom.getElementsByClassName("emoji-category")
        for (const dom of category_doms) {
            const category = dom.className.split(" ")[1]
            this.map_category_dom[category] = dom
        }
    }
    onClickMenuItem = (event, category) => {
        event.preventDefault()
        const target = this.map_category_dom[category]
        if (target) {
            this.refs.categories.scrollTop = target.offsetTop
            this.setState({
                "current_category": category
            })
        }
    }
    onPick = (shortname, category) => {
        const { picker } = this.props
        if (!!picker === false) {
            return
        }
        picker.pick(shortname, category)
    }
    render() {
        const { picker, server } = this.props

        const categories = ["pinned", "history"]
        for (const category in map_category_title) {
            categories.push(category)
        }
        const menuViews = []
        for (const category of categories) {
            menuViews.push(
                <button
                    className={classnames(`${category} item user-defined-color-active user-defined-border-color-active emojipicker-ignore-click`, { "active": category === this.state.current_category })}
                    onClick={event => this.onClickMenuItem(event, category)}>
                </button>
            )
        }

        return (
            <div className="emoji-picker scroller-wrapper emojipicker-ignore-click">
                <div className="menu emojipicker-ignore-click">
                    {menuViews}
                </div>
                <div className="categories scroller" ref="categories">
                    {this.pinned_emojis.length === 0 ? null :
                        <EmojiListView emojis={this.pinned_emojis} handle_pick={this.onPick} title="よく使う絵文字" category="pinned" />
                    }
                    {server ?
                        <EmojiListView emojis={picker.get_emoji_history()} server={server} handle_pick={this.onPick} title="履歴" category="history" />
                        : null
                    }
                    {(server && this.custom_emojis.length === 0) ? null :
                        <EmojiListView emojis={this.custom_emojis} server={server} handle_pick={this.onPick} title="カスタム" category="custom" />
                    }
                    {this.categoryViews}
                </div>
            </div>
        )
    }
}

@observer
export class EmojiPickerWindow extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "available": false
        }
    }
    componentDidMount() {
        window.addEventListener("scroll", event => {
            const { picker } = this.props
            if (picker.is_hidden === false) {
                picker.hide()
            }
        })
        document.body.addEventListener("click", event => {
            const { picker } = this.props
            const { target } = event
            if (!!target === false) {
                picker.hide()
                return true
            }
            if (is_string(target.className) && target.className.indexOf("emojipicker-ignore-click") !== -1) {
                return true
            }
            picker.hide()
        })
        this.setState({
            "available": true
        })
    }
    render() {
        const empty = <div ref="component"></div>
        if (this.state.available === false) {
            return empty
        }
        // pickerはlocalStorageを使う都合でサーバーサイドでは存在しない
        // クライアント側でも一部ページには存在しない
        const { picker, pinned, custom, server } = this.props
        if (!!picker === false) {
            return empty
        }
        const { body } = document
        if (!!body === false) {
            return empty
        }
        const { component } = this.refs
        if (!!component === false) {
            return empty
        }
        let top = picker.top
        let left = picker.left
        const padding = 10
        const width = component.clientWidth
        const height = component.clientHeight
        if (left + width + padding > body.clientWidth) {
            left = body.clientWidth - width - padding
        }
        console.log(top, height, padding)
        console.log(window.innerHeight, window.pageYOffset)
        if (top + height + padding > window.innerHeight + window.pageYOffset) {
            top = window.innerHeight + window.pageYOffset - height - padding
        }
        return (
            <div className="emoji-module" ref="component" style={{
                top, left,
                "visibility": picker.is_hidden === false ? "visible" : "hidden"
            }}>
                <EmojiPickerView picker={picker} server={server} pinned={pinned} custom={custom} />
            </div>
        )
    }
}