import config from "../../../../../beluga.config"
import TweetView from "../status/tweet"
import WebsiteView from "../status/website"

export default (sentence, entities) => {
    if (sentence.indexOf("!http") !== 0) {
        return null
    }
    if (sentence.match(/^!https?:\/\/[^\s 　]+/)) {
        const match = sentence.match(/^!https?:\/\/(mobile\.)?twitter\.com\/([a-zA-Z0-9_]+)\/status\/([0-9]+)/)
        if (match) {
            if (typeof window === "undefined") {
                return <div></div>	// SSRでiframeを表示させるとバグる
            }
            const user_name = match[2]
            const status_id = match[3]
            const src = `/embed/tweet/${user_name}/${status_id}`
            return <TweetView src={src} />
        }
        if (entities && Array.isArray(entities.urls)) {
            const match = sentence.match(/^!(https?:\/\/[^\s 　]+)/)
            if (match) {
                const original_url = match[1]
                entities.urls.forEach(item => {
                    if (item.original_url === original_url) {
                        return <WebsiteView {...item} />
                    }
                })
            }
        }
    }
    return null
}