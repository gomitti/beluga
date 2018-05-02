import { Component } from "react"
import classnames from "classnames"
import { observer } from "mobx-react"
import { observable, action } from "mobx"
import config from "../../../../beluga.config"
import { is_string } from "../../../../assert"
import { map_fname_category, map_shortname_fname, map_fname_shortname, map_category_fname, map_category_title } from "../../../../stores/emoji"

class EmojiHistory {
    @observable.shallow list = []
    constructor() {
        const history_str = localStorage.getItem("emojipicker.history")
        if (!history_str) {
            return
        }
        const history = JSON.parse(history_str)
        if (Array.isArray(history) === false) {
            return
        }
        if (history.length > 0) {
            this.list = history
        }
    }
    @action.bound
    add(emoji) {
        const list = []
        for (const _emoji of this.list) {
            if (emoji.shortname === _emoji.shortname) {
                continue
            }
            list.push(_emoji)
        }
        list.unshift(emoji)
        if (list.length > config.emoji.history.capacity) {
            list.pop()
        }
        this.list = list
        localStorage.setItem("emojipicker.history", JSON.stringify(list))
    }
}

export class EmojiPicker {
    @observable top = 0
    @observable left = 0
    @observable is_hidden = true
    @observable.shallow history = new EmojiHistory()
    @action.bound
    show(left, top, callback_pick, callback_hide) {
        this.top = top
        this.left = left
        this.callback_pick = callback_pick
        this.callback_hide = callback_hide
        this.is_hidden = false
    }
    @action.bound
    hide() {
        this.is_hidden = true
        if (this.callback_hide) {
            this.callback_hide()
        }
        this.callback_pick = null
        this.callback_hide = null
    }
}

@observer
class EmojiListView extends Component {
    render() {
        const { emojis, pick, title, category } = this.props
        if (!emojis) {
            return null
        }
        if (emojis.length === 0) {
            return null
        }
        const buttons = []
        for (const emoji of emojis) {
            const { shortname, category, fname } = emoji
            buttons.push(<button onClick={event => pick(shortname, category, fname)} className="emojipicker-ignore-click" ><i className={`emojipicker-ignore-click emoji-${category} _${fname}`}></i></button>)
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

export class EmojiPickerView extends Component {
    constructor(props) {
        super(props)
        const { pick } = props
        this.state = {
            "current_category": "favorites"
        }
        this.categoryViews = []
        for (const category in map_category_fname) {
            const title = map_category_title[category]
            const buttons = []
            const array = map_category_fname[category]
            for (const fname of array) {
                const shortname = map_fname_shortname[fname]
                buttons.push(<button onClick={event => pick(shortname, category, fname)} className="emojipicker-ignore-click" ><i className={`emojipicker-ignore-click emoji-${category} _${fname}`}></i></button>)
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
    render() {
        const { pick, history, favorites } = this.props
        const emoji_favorites = []
        if (Array.isArray(favorites)) {
            for (const shortname of favorites) {
                const fname = map_shortname_fname[shortname]
                const category = map_fname_category[fname]
                if (fname && category) {
                    emoji_favorites.push({ shortname, category, fname })
                }
            }
        }
        return (
            <div className="emoji-picker scroller-wrapper emojipicker-ignore-click">
                <div className="menu emojipicker-ignore-click">
                    {(() => {
                        const categories = ["favorites", "history"]
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
                        return menuViews
                    })()}
                </div>
                <div className="categories scroller" ref="categories">
                    {(() => {
                        if (emoji_favorites.length > 0) {
                            return <EmojiListView emojis={emoji_favorites} pick={pick} title="お気に入り" category="favorites" />
                        }
                    })()}
                    <EmojiListView emojis={history} pick={pick} title="履歴" category="history" />
                    {this.categoryViews}
                </div>
            </div>
        )
    }
}

@observer
export default class EmojiPickerWindow extends Component {
    constructor(props) {
        super(props)
        if (typeof window !== "undefined") {
            window.addEventListener("scroll", event => {
                const { picker } = this.props
                if (picker && picker.is_hidden === false) {
                    picker.hide()
                }
            })
        }
    }
    componentDidMount() {
        const { picker } = this.props
        document.body.addEventListener("click", event => {
            const { target } = event
            if (!target) {
                picker.hide()
                return true
            }
            if (is_string(target.className) && target.className.indexOf("emojipicker-ignore-click") !== -1) {
                return true
            }
            picker.hide()
        })
    }
    pick = (shortname, category, fname) => {
        const { picker } = this.props
        picker.history.add({ shortname, category, fname })
        if (picker.callback_pick) {
            picker.callback_pick(shortname, category, fname)
        }
    }
    render() {
        // pickerはlocalStorageを使う都合でサーバーサイドでは存在しない
        const { picker, favorites } = this.props
        const is_hidden = picker ? picker.is_hidden : true
        let top = picker ? picker.top : 0
        let left = picker ? picker.left : 0
        const component = this.refs.component
        if (picker && document && component) {
            const padding = 10
            const { body } = document
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
        }
        return (
            <div className="emoji-module" ref="component" style={{
                top, left,
                "visibility": is_hidden === false ? "visible" : "hidden"
            }}>
                {picker ? <EmojiPickerView pick={this.pick} favorites={favorites} history={picker.history.list} /> : null}
            </div>
        )
    }
}