import config from "../../../../../beluga.config"
import VideoComponent from "../status/video"

export default sentence => {
    const url = sentence
    if (url.match(/\.(mp4|webm)$/)) {
        let parts = url.match(/(.+)\/([0-9]+)-([0-9]+)\.(mp4|webm)/)
        if (parts) {
            const prefix = parts[1]
            const width = parts[2]
            const height = parts[3]
            const poster_url = `${prefix}/${width}-${height}.poster.jpg`
            return <VideoComponent src={url} poster={poster_url} width={width} height={height} />
        }
    }
    return null
}