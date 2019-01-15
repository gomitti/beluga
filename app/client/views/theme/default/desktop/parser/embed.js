import config from "../../../../../beluga.config"
import TweetView from "react-tweet-embed"
import WebsiteView from "../status/website"
import { is_object, is_array } from "../../../../../assert";

export default (sentence, entities) => {
    if (is_object(entities) === false) {
        return null
    }
    if (sentence.indexOf("!http") !== 0) {
        return null
    }
    const { urls } = entities
    if (is_array(urls) === false) {
        return null
    }
    if (sentence.match(/^!https?:\/\/[^\s 　]+/)) {
        {
            const match = sentence.match(/^!https?:\/\/(mobile\.)?twitter\.com\/([a-zA-Z0-9_]+)\/status\/([0-9]+)/)
            if (match) {
                if (typeof window === "undefined") {
                    return <div></div>	// SSRでiframeを表示させるとバグる
                }
                const status_id = match[3]
                return <TweetView id={status_id} />
            }
        }
        {
            const match = sentence.match(/^!(https?:\/\/[^\s 　]+)/)
            if (match) {
                const original_url = match[1]
                for (let j = 0; j < urls.length; j++) {
                    const item = urls[j]
                    if (item.original_url === original_url) {
                        return <WebsiteView {...item} />
                    }
                }
            }
        }
    }
    return null
}