import React, { Component } from "react"
import { Player, BigPlayButton, ControlBar } from "video-react"

export default class VideoComponent extends Component {
    render() {
        const { width, height, src, poster } = this.props
        return (
            <div className="status-body-video">
                <Player
                    src={src}
                    width="100%"
                    height="auto"
                    poster={poster}
                    preload="none"
                    fluid={false}
                    controls >
                    <BigPlayButton position="center" />
                    <ControlBar autoHide={false} disableDefaultControls={false} />
                </Player>
            </div>
        )
    }
}