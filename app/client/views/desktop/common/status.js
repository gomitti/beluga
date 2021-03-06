import React, { Component } from "react"
import { observer } from "mobx-react"
import config from "../../../beluga.config"

class ImageView extends Component {
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
            return <img src={this.props.src} width={this.state.width} height={this.state.height} />
        }
        return <img ref="img" src={this.props.src} onLoad={this.onLoad} width="0" height="0" />
    }
}

@observer
export default class StatusComponent extends Component {
    render() {
        const status = this.props.status
        const lines = status.text.split("\n")
        const lineViews = []
        const is_server_side = typeof window === "undefined"
        lines.forEach(str => {
            const components = str.split(/(https?:\/\/[^\s ]+)/)
            const subViews = []
            components.forEach(substr => {
                if (substr.indexOf("http") === 0) {
                    const url = substr
                    if (url.match(/\.(jpg|jpeg|png|gif)$/)) {
                        const max_size = config.status.image.max_size.desktop
                        let parts = url.match(/(.+)\/([0-9]+)-([0-9]+)\.(jpg|jpeg|png|gif)/)
                        if (parts) {
                            const prefix = parts[1]
                            const width = parts[2]
                            const height = parts[3]
                            let ratio = 1
                            if (Math.max(width, height) > max_size) {
                                ratio = max_size / Math.max(width, height)
                            }
                            const dom_width = width * ratio
                            const dom_height = height * ratio
                            const ext = parts[4]
                            const href = url
                            const src = `${prefix}/${width}-${height}.small.${ext}`
                            if (is_server_side) {
                                subViews.push(<a href={href} target="_blank"></a>)
                                continue
                            }
                            subViews.push(<a href={href} target="_blank"><img src={src} width={dom_width} height={dom_height} /></a>)
                            continue
                        }
                        parts = url.match(/(.+)\/([0-9]+)-([0-9]+)\.medium\.(jpg|jpeg|png|gif)/)
                        if (parts) {
                            const prefix = parts[1]
                            const width = parts[2]
                            const height = parts[3]
                            let ratio = 1
                            if (Math.max(width, height) > max_size) {
                                ratio = max_size / Math.max(width, height)
                            }
                            const dom_width = width * ratio
                            const dom_height = height * ratio
                            const ext = parts[4]
                            const href = url
                            const src = `${prefix}/${width}-${height}.small.${ext}`
                            if (is_server_side) {
                                subViews.push(<a href={href} target="_blank"></a>)
                                continue
                            }
                            subViews.push(<a href={href} target="_blank"><img src={src} width={dom_width} height={dom_height} /></a>)
                            continue
                        }
                        parts = url.match(/(.+)\/([0-9]+)-([0-9]+)\.small\.(jpg|jpeg|png|gif)/)
                        if (parts) {
                            const prefix = parts[1]
                            const width = parts[2]
                            const height = parts[3]
                            let ratio = 1
                            if (Math.max(width, height) > max_size) {
                                ratio = max_size / Math.max(width, height)
                            }
                            const dom_width = width * ratio
                            const dom_height = height * ratio
                            const ext = parts[4]
                            const href = url
                            const src = url
                            if (is_server_side) {
                                subViews.push(<a href={href} target="_blank"></a>)
                                continue
                            }
                            subViews.push(<a href={href} target="_blank"><img src={src} width={dom_width} height={dom_height} /></a>)
                            continue
                        }
                        if (is_server_side) {
                            subViews.push(<a href={url} target="_blank"></a>)
                            continue
                        }
                        subViews.push(<a href={url}><ImageComponent src={url} /></a>)
                        continue
                    }
                    subViews.push(<a href={url} target="_blank">{url}</a>)
                } else {
                    subViews.push(<span>{substr}</span>)
                }
            })
            lineViews.push(<p>{subViews}</p>)
        })
        return (
            <div className="status">
                <div className="inside">
                    <div className="header">
                        <a href="/user/" className="avatar">
                            <span className="name">@{status.user.name}</span>
                            <img src={status.user.avatar_url} />
                        </a>
                    </div>
                    <div className="content">
                        <div className="body">{lineViews}</div>
                    </div>
                </div>
            </div>
        );
    }
}