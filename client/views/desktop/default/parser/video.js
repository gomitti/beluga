import config from "../../../../beluga.config"
import VideoView from "../status/video"

export default sentence => {
	const url = sentence
	if (url.match(/\.(mp4)$/)) {
		let parts = url.match(/(.+)\/([0-9]+)-([0-9]+)\.(mp4)/)
		if (parts) {
			const prefix = parts[1]
			const width = parts[2]
			const height = parts[3]
			const poster_url = `${prefix}/${width}-${height}.poster.jpg`
			return <VideoView src={url} poster={poster_url} width={width} height={height} />
		}
	}
	return null
}