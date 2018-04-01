import React, { Component } from "react"
import config from "../../../../../beluga.config"

export default class ImageView extends Component {
    constructor(props) {
        super(props)
        this.state = {}
    }
    onLoad = event => {
        const img = this.refs.img
        if (img) {
            const max_size = config.status.image.max_size.desktop
            const width = img.naturalWidth || img.width
            const height = img.naturalHeight || img.height
            let ratio = 1
            if (Math.max(width, height) > max_size) {
                ratio = max_size / Math.max(width, height)
            }
            const dom_width = width * ratio
            const dom_height = height * ratio
            this.setState({
                "width": dom_width,
                "height": dom_height
            })
        }
    }
    render() {
        if (this.state.width && this.state.height) {
            return <a href={this.props.src} target="_blank" style={{
                "maxWidth": this.state.width,
                "maxHeight": this.state.height,
            }}>
                <img src={this.props.src} />
            </a>
        }
        if (typeof window === "undefined") {
            return null
        }
        // <div>で囲むとonLoadが正しく呼ばれる謎
        return <img ref="img" onLoad={this.onLoad} src={this.props.src} width="0" height="0" />
    }
}