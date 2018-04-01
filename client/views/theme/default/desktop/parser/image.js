import config from "../../../../../beluga.config"
import ImageView from "../status/image"
import GifView from "../status/gif"

export default sentence => {
    const url = sentence
    if (url.match(/\.(jpg|jpeg|png|gif)(:orig)?$/)) {
        const max_size = config.status.image.max_size.desktop
        let parts = url.match(/(.+)\/([0-9]+)-([0-9]+)\.(jpg|jpeg|png|gif)/)
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
            const href = url
            if (ext === "gif") {
                const coalesce_src = `${prefix}/${width}-${height}.coalesce.png`
                const original_src = url
                return <GifView original_src={original_src} coalesce_src={coalesce_src} width={dom_width} height={dom_height} />
            } else {
                const src = `${prefix}/${width}-${height}.small.${ext}`
                return <a href={href} target="_blank" style={{
                    "maxWidth": dom_width,
                    "maxHeight": dom_height,
                }}><img src={src} /></a>
            }
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
            return <a href={href} target="_blank" style={{
                "maxWidth": dom_width,
                "maxHeight": dom_height,
            }}><img src={src} /></a>
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
            return <a href={href} target="_blank" style={{
                "maxWidth": dom_width,
                "maxHeight": dom_height,
            }}><img src={src} /></a>
        }
        return <ImageView src={url} />
    }
    return null
}