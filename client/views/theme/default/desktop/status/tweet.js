import React, { Component } from "react"

const detect_widget_loaded = iframe => {
    const { contentDocument } = iframe
    if (!!contentDocument === false) {
        return false
    }
    const { body } = contentDocument
    if (!!body === false) {
        return false
    }
    if (body.getElementsByClassName("twitter-tweet-rendered").length === 1) {
        return true
    }
    if (body.getElementsByTagName("twitterwidget").length === 1) {
        return true
    }
    return false
}

export default class TweetView extends Component {
    onLoad = event => {
        const iframe = this.refs.iframe
        if (!iframe) {
            return
        }
        console.log("onLoad")
        const timer_func = () => {
            this.retry += 1
            if (this.retry > 20) {
                return
            }
            setTimeout(timer_func, 200 * (this.retry + 1))
            if (detect_widget_loaded(iframe) === false) {
                console.log("not loaded")
                return
            }
            let height = iframe.contentWindow.document.documentElement.scrollHeight
            console.log(height)
            if (typeof height === "number" && height > iframe.height) {
                iframe.height = height;
            }
        }
        this.retry = 0
        setTimeout(timer_func, 200)
    }
    render() {
        const { src } = this.props
        return (
            <iframe className="status-body-tweet" scrolling="no" frameBorder="no" src={src} onLoad={this.onLoad} ref="iframe"></iframe>
        )
    }
}