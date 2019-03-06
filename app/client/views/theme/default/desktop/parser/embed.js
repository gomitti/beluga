import config from "../../../../../beluga.config"
import TweetComponent from "react-tweet-embed"
import WebsiteComponent from "../status/website"
import { is_object, is_array } from "../../../../../assert";

export default (url, entities) => {
    if (is_object(entities) === false) {
        return null
    }
    if (url.indexOf("!http") !== 0) {
        return null
    }
    const { urls } = entities
    if (is_array(urls) === false) {
        return null
    }
    if (url.match(/^!https?:\/\/[^\s 　]+/)) {
        {
            const match = url.match(/^!https?:\/\/(mobile\.)?twitter\.com\/([a-zA-Z0-9_]+)\/status\/([0-9]+)/)
            if (match) {
                if (typeof window === "undefined") {
                    return <div className="status-body-tweet"></div>	// SSRでiframeを表示させるとバグる
                }
                const status_id = match[3]
                return <TweetComponent id={status_id} className="status-body-tweet" />
            }
        }
        {
            const match = url.match(/^!(https?:\/\/[^\s 　]+)/)
            if (match) {
                const original_url = match[1]
                for (let j = 0; j < urls.length; j++) {
                    const item = urls[j]
                    if (item.original_url === original_url) {
                        return <WebsiteComponent {...item} />
                    }
                }
            }
        }
    }
    return null
}