import hashtag from "./timeline/hashtag"
import home from "./timeline/home"
import server from "./timeline/server"
import mentions from "./timeline/mentions"
import config from "../../config/beluga"

const default_params = {
    "count": config.timeline.default_count,
    "since_id": null,
    "max_id": null,
    "sort": -1
}

export default { hashtag, home, server, mentions, default_params }