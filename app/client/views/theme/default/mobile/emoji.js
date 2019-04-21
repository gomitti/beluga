import { Component } from "react"
import classnames from "classnames"
import { observer } from "mobx-react"
import { EmojiPickerBaseComponent, dispatch_event, event_types } from "../desktop/emoji"
import * as EmojiPickerStore from "../../../../stores/theme/default/common/emoji"

const register_methods = target => {
    target.show = (community, callback_pick, callback_hide) => {
        const picker = EmojiPickerStore.shared_instance
        if (community) {
            picker.setCommunityId(community.id)
        } else {
            picker.setCommunityId(null)
        }
        dispatch_event(event_types.show, { callback_pick, callback_hide })
    }
    target.toggle = (community, callback_pick, callback_hide) => {
        const picker = EmojiPickerStore.shared_instance
        if (community) {
            picker.setCommunityId(community.id)
        } else {
            picker.setCommunityId(null)
        }
        dispatch_event(event_types.toggle, { callback_pick, callback_hide })
    }
    target.hide = () => {
        dispatch_event(event_types.hide, {})
    }
}

class EmojiPickerWindowComponent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_hidden": true,
            "callback_pick": null,
            "callback_hide": null
        }
        if (typeof window !== "undefined") {
            window.addEventListener(event_types.show, this.show)
            window.addEventListener(event_types.hide, this.hide)
            window.addEventListener(event_types.toggle, this.toggle)
        }
    }
    show = payload => {
        const { detail } = payload
        const { callback_pick, callback_hide } = detail
        this.setState({
            "is_hidden": false,
            "callback_pick": callback_pick,
            "callback_hide": callback_hide
        })
        dispatch_event(event_types.focus_input, null)
    }
    toggle = payload => {
        if (this.state.is_hidden) {
            this.show(payload)
        } else {
            this.hide()
        }
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
    onPick = shortname => {
        const { callback_pick } = this.state
        if (callback_pick) {
            callback_pick(shortname)
        }
        const picker = EmojiPickerStore.shared_instance
        picker.shortnameDidPick(shortname)
        EmojiPicker.hide()
    }
    render() {
        return (
            <div className={classnames("emoji-picker-window-component", {
                "hidden": this.state.is_hidden
            })} ref="component">
                <EmojiPickerBaseComponent handle_pick={this.onPick} />
            </div>
        )
    }
}

@register_methods
class EmojiPicker extends Component {
    render() {
        const { pinned_shortnames, community } = this.props
        return (
            <div>
                <EmojiPickerWindowComponent />
            </div>

        )
    }
}

export default EmojiPicker