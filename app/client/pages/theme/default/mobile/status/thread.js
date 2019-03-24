import { configure } from "mobx"
import NavigationbarComponent from "../../../../../views/theme/default/mobile/navigationbar"
import ColumnStore from "../../../../../stores/theme/default/mobile/column"
import { ThreadColumnComponent } from "../../../../../views/theme/default/mobile/column"
import Head from "../../../../../views/theme/default/mobile/head"
import config from "../../../../../beluga.config"
import assert, { is_object, is_string, is_array } from "../../../../../assert"
import EmojiPicker from "../../../../../views/theme/default/mobile/emoji"
import ThreadTimelineHeaderComponent from "../../../../../views/theme/default/mobile/header/timeline/thread"
import PostboxComponent from "../../../../../views/theme/default/mobile/postbox"
import { TimelineComponent } from "../../../../../views/theme/default/mobile/timeline"
import Component from "../../../../../views/app"
import { ColumnOptions } from "../../../../../stores/theme/default/desktop/column"
import { StatusOptions } from "../../../../../stores/theme/default/common/status"
import { TimelineOptions } from "../../../../../stores/theme/default/desktop/timeline"
import ThreadTimelineStore from "../../../../../stores/theme/default/desktop/timeline/thread"
import PostboxStore from "../../../../../stores/theme/default/common/postbox"
import UploadManager from "../../../../../stores/theme/default/common/uploader"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    constructor(props) {
        super(props)
        const { has_newer_statuses, has_older_statuses, statuses, muted_users, muted_words, logged_in_user } = props

        const timeline_options = new TimelineOptions()
        timeline_options.has_newer_statuses = has_newer_statuses
        timeline_options.has_older_statuses = has_older_statuses
        if (has_newer_statuses) {
            timeline_options.auto_reloading_enabled = false
        }
        timeline_options.muted_users = muted_users
        timeline_options.muted_words = muted_words

        const status_options = new StatusOptions()
        status_options.trim_comments = false
        status_options.show_source_link = false

        this.timeline_options = timeline_options
        this.status_options = status_options

        const { in_reply_to_status } = this.props
        this.timeline = new ThreadTimelineStore({
            "in_reply_to_status_id": in_reply_to_status.id
        }, {}, timeline_options, logged_in_user)
        this.timeline.setStatuses(statuses)

        this.postbox = new PostboxStore({
            "in_reply_to_status_id": in_reply_to_status.id
        })

        this.uploader = new UploadManager()
    }
    render() {
        const { in_reply_to_status, community, logged_in_user, platform, device,
            pinned_media, recent_uploads, pinned_emoji_shortnames, request_query } = this.props
        const { text } = in_reply_to_status
        const title = (text.length > 50) ? text.substr(0, 50) + "…" : text
        return (
            <div className="app">
                <Head title={`${title} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} device={device} />
                <NavigationbarComponent logged_in_user={logged_in_user} active_tab="direct_message" />
                <div className="client">
                    <div className="column-component">
                        <div className="inside">
                            <ThreadTimelineHeaderComponent in_reply_to_status={in_reply_to_status} />
                            <div className="contents">
                                <div className="vertical-line"></div>
                                <PostboxComponent
                                    postbox={this.postbox}
                                    timeline={this.timeline}
                                    logged_in_user={logged_in_user}
                                    uploader={this.uploader}
                                    pinned_media={pinned_media}
                                    recent_uploads={recent_uploads} />
                                <TimelineComponent
                                    total_num_statuses={in_reply_to_status.comments_count}
                                    in_reply_to_status={in_reply_to_status}
                                    logged_in_user={logged_in_user}
                                    timeline={this.timeline}
                                    request_query={request_query}
                                    timeline_options={this.timeline_options}
                                    status_options={this.status_options} />
                            </div>
                        </div>
                    </div>
                </div>
                <EmojiPicker pinned_shortnames={pinned_emoji_shortnames} />
            </div>
        )
    }
}