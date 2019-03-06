import channel from "./timeline/channel"
import message from "./timeline/message"
import community from "./timeline/community"
import notifications from "./timeline/notifications"
import thread from "./timeline/thread"
import config from "../../config/beluga"

const default_params = {
    "count": config.timeline.default_count,
    "since_id": null,
    "max_id": null,
    "sort": -1
}

export default { channel, message, community, notifications, thread, default_params }