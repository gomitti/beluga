import { Component } from "react"
import classnames from "classnames"
import { observer } from "mobx-react"
import { EmojiPickerView } from "../desktop/emoji"
import { get_shared_picker_store } from "../../../../stores/theme/default/common/emoji"

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
    target.show = (callback_pick, callback_hide) => {
        dispatch_event(event_types.show, { callback_pick, callback_hide })
    }
    target.toggle = (callback_pick, callback_hide) => {
        dispatch_event(event_types.toggle, { callback_pick, callback_hide })
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
        }
        this.picker = null
        if (typeof window !== "undefined") {
            window.removeEventListener(event_types.show, this.show)
            window.addEventListener(event_types.show, this.show, false)
            window.removeEventListener(event_types.hide, this.hide)
            window.addEventListener(event_types.hide, this.hide, false)
            window.removeEventListener(event_types.toggle, this.toggle)
            window.addEventListener(event_types.toggle, this.toggle, false)
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
        const { callback_pick, callback_hide } = detail
        this.setState({
            "is_hidden": false,
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
        const empty = <div className={classnames("emoji-module", { "hidden": this.state.is_hidden })} ref="component"></div>
        if (this.state.available === false) {
            return empty
        }
        const { pinned_shortnames, custom_shortnames, server } = this.props
        return (
            <div className={classnames("emoji-module", { "hidden": this.state.is_hidden })} ref="component">
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