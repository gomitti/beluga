import { configure } from "mobx"
import NavigationbarComponent from "../../../../../../views/theme/default/mobile/navigationbar"
import HeaderComponent from "../../../../../../views/theme/default/mobile/header/column/notifications"
import Head from "../../../../../../views/theme/default/mobile/head"
import config from "../../../../../../beluga.config"
import EmojiPicker from "../../../../../../views/theme/default/mobile/emoji"
import Component from "../../../../../../views/app"
import { StatusGroupTimelineComponent } from "../../../../../../views/theme/default/mobile/timeline"
import { TimelineOptions } from "../../../../../../stores/theme/default/desktop/timeline"
import { StatusOptions } from "../../../../../../stores/theme/default/common/status"
import NotificationsTimelineStore from "../../../../../../stores/theme/default/desktop/timeline/notifications"

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
        status_options.trim_comments = true
        status_options.show_source_link = true

        this.timeline_options = timeline_options
        this.status_options = status_options

        this.timeline = new NotificationsTimelineStore({}, {}, timeline_options, logged_in_user)
        this.timeline.setStatuses(statuses)
    }
    render() {
        const { logged_in_user, platform, device, pinned_emoji_shortnames } = this.props
        const title = `通知 / ${config.site.name}`
        return (
            <div className="app">
                <Head title={title} platform={platform} logged_in_user={logged_in_user} device={device} />
                <NavigationbarComponent logged_in_user={logged_in_user} active_tab="notifications" />
                <div className="client">
                    <div className="inside">
                        <div className="notifications-component rounded-corner timeline">
                            <div className="inside">
                                <HeaderComponent user={logged_in_user} active_tab="all" />
                                <StatusGroupTimelineComponent
                                    logged_in_user={logged_in_user}
                                    timeline={this.timeline}
                                    request_query={{}}
                                    timeline_options={this.timeline_options}
                                    status_options={this.status_options}
                                    only_merge_thread={true} />
                            </div>
                        </div>
                    </div>
                </div>
                <EmojiPicker pinned_shortnames={pinned_emoji_shortnames} />
            </div>
        )
    }
}