import config from "../../../../../beluga.config"
import VideoView from "../video"

export default sentence => {
	const url = sentence
	if (url.match(/\.(mp4)$/)) {
		const max_size = config.status.image.max_size.desktop
		let parts = url.match(/(.+)\/([0-9]+)-([0-9]+)\.(mp4)/)
		if (parts) {
			const prefix = parts[1]
			const width = parts[2]
			const height = parts[3]
			const ext = parts[4]

			let ratio = 1
			if (Math.max(width, height) > max_size) {
				ratio = max_size / Math.max(width, height)
			}
			const dom_width = width * ratio
			const dom_height = height * ratio
			
			const poster_url = `${prefix}/${width}-${height}.poster.jpg`
			return <VideoView src={url} poster={poster_url} width={dom_width} height={dom_height} />
		}
	}
	return null
}