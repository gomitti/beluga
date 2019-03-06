import { Component } from "react"
import classnames from "classnames"
import assert, { is_number } from "../../../../assert"

const event_types = {
    "show": "__event_tooltip_show",
    "hide": "__event_tooltip_hide",
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
    target.show = (dom, message, padding) => {
        dispatch_event(event_types.show, { dom, message, padding })
    }
    target.hide = () => {
        dispatch_event(event_types.hide, {})
    }
}

@register_methods
class Tooltip extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_hidden": true,
            "message": null,
            "bottom": 0,
            "left": 0
        }
        if (typeof window !== "undefined") {
            window.removeEventListener(event_types.show, this.show)
            window.addEventListener(event_types.show, this.show, false)
            window.removeEventListener(event_types.hide, this.hide)
            window.addEventListener(event_types.hide, this.hide, false)
            window.removeEventListener("resize", this.hide)
            window.addEventListener("resize", this.hide, false)
        }
    }
    show = payload => {
        if (this.state.is_hidden === false) {
            return
        }
        const { detail } = payload
        const { dom, message } = detail
        let { padding } = detail
        const rect = dom.getBoundingClientRect()
        if (is_number(padding) === false) {
            padding = 10
        }
        let offset_left = 0
        let offset_top = 0
        const base = document.getElementsByClassName("tooltip-offset-base")
        if (base.length == 1) {
            const offset = base[0].getBoundingClientRect()
            offset_left += offset.left
            offset_top += offset.top
        }
        const page_height = document.getElementsByClassName("app")[0].clientHeight
        this.setState({
            "is_hidden": false,
            "message": message,
            "left": rect.left + rect.width / 2 - 100 - offset_left,
            "bottom": page_height - rect.top + padding + offset_top
        })
    }
    hide = () => {
        if (this.state.is_hidden) {
            return
        }
        this.setState({
            "is_hidden": true,
            "message": null,
            "left": 0,
            "bottom": 0
        })
    }
    render() {
        return (
            <div id="tooltip"
                className={classnames({
                    "hidden": this.state.is_hidden
                })}
                style={{
                    "bottom": this.state.bottom,
                    "left": this.state.left
                }}>
                <span className="message">{this.state.message}</span>
            </div>
        )
    }
}

export default Tooltip