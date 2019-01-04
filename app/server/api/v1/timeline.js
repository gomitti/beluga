import channel from "./timeline/channel"
import home from "./timeline/home"
import server from "./timeline/server"
import notifications from "./timeline/notifications"
import thread from "./timeline/thread"
import config from "../../config/beluga"

const default_params = {
    "count": config.timeline.default_count,
    "since_id": null,
    "max_id": null,
    "sort": -1
}

export default { channel, home, server, notifications, thread, default_params }