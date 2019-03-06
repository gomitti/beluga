import { Component } from "react"
import classnames from "classnames"
import assert, { is_string } from "../../../../assert"

const event_types = {
    "push": "__event_toast_push",
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
    target.push = (message, ok) => {
        assert(is_string(message), "$message must be of type string")
        dispatch_event(event_types.push, { message, ok })
    }
}

@register_methods
class Toast extends Component {
    constructor(props) {
        super(props)
        if (typeof window !== "undefined") {
            window.addEventListener(event_types.push, this.push)
        }
        this.state = {
            "message_array": []
        }
        this.current_message_id = 0
    }
    push = payload => {
        this.current_message_id += 1
        const { detail } = payload
        const { message, ok } = detail
        const id = this.current_message_id
        const { message_array } = this.state
        const should_hide = false
        message_array.push({
            id,
            message,
            should_hide,
            ok,
        })
        console.log(message_array)
        this.setState({ message_array })
        setTimeout(() => {
            this.pop(id)
        }, 3000)
    }
    pop = item_id_to_pop => {
        const { message_array } = this.state
        message_array.forEach(item => {
            if (item.id === item_id_to_pop) {
                item.should_hide = true
            }
        })
        this.setState({ message_array })

        setTimeout(() => {
            const { message_array } = this.state
            const new_message_array = []
            message_array.forEach(item => {
                if (item.id === item_id_to_pop) {
                    return
                }
                new_message_array.push(item)
            })
            this.setState({ "message_array": new_message_array })
        }, 250)
    }
    render() {
        console.log("[Toast] render")
        const messageList = []
        this.state.message_array.forEach(item => {
            messageList.push(
                <div className={classnames("item", { "fade-out": item.should_hide, "fade-in": !item.should_hide, "success": item.ok, "error": !item.ok })} key={item.id}>
                    <div className="inside">{item.message}</div>
                </div>
            )
        })
        return (
            <div id="toast">
                <ul className="messages">{messageList}</ul>
            </div>
        )
    }
}

export default Toast