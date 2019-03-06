import React, { Component } from "react"

export default class GifComponent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "loaded": false,
            "pending": false,
            "display": false
        }
    }
    onLoad = event => {
        this.setState({
            "loaded": true,
            "pending": false,
            "display": true
        })
    }
    onMouseEnter = event => {
        this.setState({
            "display": true
        })
    }
    onMouseLeave = event => {
        this.setState({
            "display": false
        })
    }
    render() {
        const { width, height, coalesce_src, original_src } = this.props
        const src = this.state.display ? original_src : coalesce_src
        return (
            <div className="status-body-gif"
                onMouseEnter={this.onMouseEnter}
                onMouseLeave={this.onMouseLeave}
                style={{
                    "maxWidth": width,
                    "maxHeight": height
                }}>
                <span className="watermark"><i></i></span>
                <a href={original_src} target="_blank">
                    <img src={src} />
                </a>
            </div>
        )
    }
}