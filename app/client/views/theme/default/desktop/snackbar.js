import { Component } from "react"
import classnames from "classnames"

const event_types = {
    "show": "__event_snackbar_show",
    "hide": "__event_snackbar_hide",
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
    target.show = (message, is_error) => {
        dispatch_event(event_types.show, { message, is_error })
    }
    target.hide = () => {
        dispatch_event(event_types.hide, {})
    }
}

@register_methods
class Snackbar extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_hidden": true,
            "is_error": false,
            "message": null,
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
        if (this.timer_id) {
            clearTimeout(this.timer_id)
        }
        const { detail } = payload
        const { message, is_error } = detail
        this.setState({
            "is_hidden": false,
            "is_error": is_error,
            "message": message,
        })
        this.timer_id = setTimeout(() => {
            this.hide()
        }, message.length * 250)
    }
    hide = () => {
        if (this.state.is_hidden) {
            return
        }
        this.setState({
            "is_hidden": true,
            "is_error": false,
            "message": null,
        })
    }
    render() {
        return (
            <div id="snackbar" className={classnames({
                "error": this.state.is_error,
                "show": !this.state.is_hidden,
                "hide": this.state.is_hidden,
            })}>
                <div className="message">{this.state.message}</div>
            </div>
        )
    }
}

export default Snackbar