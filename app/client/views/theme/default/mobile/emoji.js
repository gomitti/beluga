import { Component } from "react"
import classnames from "classnames"
import { observer } from "mobx-react"
import { EmojiPickerComponent } from "../desktop/emoji"
import { get_shared_picker_store } from "../../../../stores/theme/default/common/emoji"

const event_types = {
    "show": "__event_emoji_picker_show",
    "toggle": "__event_emoji_picker_toggle",
    "hide": "__event_emoji_picker_hide",
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

@observer
class EmojiPickerWindowComponent extends Component {
    constructor(props) {
        super(props)
        if (typeof window !== "undefined") {
            window.addEventListener(event_types.show, this.show)
            window.addEventListener(event_types.hide, this.hide)
            window.addEventListener(event_types.toggle, this.toggle)
        }
    }
    show = payload => {
        const { picker } = this.props
        const { detail } = payload
        const { callback_pick, callback_hide } = detail
        picker.show((shortname, category) => {
            callback_pick(shortname, category)
            picker.hide()
        }, callback_hide)
    }
    toggle = payload => {
        const { picker } = this.props
        if (picker.is_active) {
            this.hide()
        } else {
            this.show(payload)
        }
    }
    hide = () => {
        const { picker } = this.props
        picker.hide()
    }
    render() {
        const { picker, pinned_shortnames, community } = this.props
        if (picker === null) {
            return null
        }
        return (
            <div className={classnames("emoji-picker-window-component", { "hidden": !picker.is_active })} ref="component">
                <EmojiPickerComponent
                    picker={picker}
                    community={community}
                    pinned_shortnames={pinned_shortnames} />
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
            const { community } = props
            this.picker = get_shared_picker_store(community)
        }
    }
    render() {
        const { pinned_shortnames, community } = this.props
        return (
            <div>
                <EmojiPickerWindowComponent
                    pinned_shortnames={pinned_shortnames}
                    picker={this.picker}
                    community={community} />
            </div>

        )
    }
}

export default EmojiPicker