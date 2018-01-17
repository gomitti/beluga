import hashtag from "./timeline/hashtag"
import home from "./timeline/home"
import server from "./timeline/server"
import config from "../../config/beluga"

const default_params = {
	"count": config.timeline.count.default,
	"since_id": null,
	"max_id": null,
	"trim_user": true,
	"trim_server": true,
	"trim_hashtag": true,
	"trim_recipient": true,
	"sort": -1
}

export default { hashtag, home, server, default_params }