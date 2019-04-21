import { Component } from "react"
import HeaderComponent from "../../../../views/desktop/common/header"
import Head from "../../../../views/theme/default/mobile/head"
import AppComponent from "../../../../views/app"
import ws from "../../../../websocket"
import { StatusHeaderDisplayNameComponent, StatusHeaderUserStatusComponent } from "../../../../views/theme/default/mobile/status/header"
import { StatusTimeComponent } from "../../../../views/theme/default/desktop/status"
import { StatusOptions } from "../../../../stores/theme/default/common/status"
import { build_status_body_views } from "../../../../views/theme/default/desktop/parser"
import { created_at_to_elapsed_time, time_string_from_create_at, date_string_from_create_at } from "../../../../libs/date"


class StatusComponent extends Component {
    constructor(props) {
        super(props)
        const { status, handle_click_channel, handle_click_mention, handle_click_thread } = props


        // 本文のビューを構築しておく
        const { text, community, entities } = status
        const body = build_status_body_views(text, community, entities, { handle_click_channel, handle_click_mention, handle_click_thread })

        const { created_at } = status
        this.state = {
            "elapsed_time_str": created_at_to_elapsed_time(created_at),
            "created_at_str": time_string_from_create_at(created_at),
            "date_str": date_string_from_create_at(created_at),
            "body": body
        }
    }
    componentDidMount = () => {
        this.updateTime()
    }
    updateTime() {
        const { status } = this.props
        const base = Date.now()
        let diff = (base - status.created_at) / 1000
        let new_interval = 3600
        if (diff < 60) {
            new_interval = 5
        } else if (diff < 3600) {
            new_interval = 60
        } else {
            new_interval = 1800
        }
        clearInterval(this._update_time)
        this._update_time = setInterval(() => {
            this.updateTime()
        }, new_interval * 1000)
        this.setState({
            "elapsed_time_str": created_at_to_elapsed_time(status.created_at),
        })
    }
    render() {
        const { status, options, handle_click_channel, handle_click_mention, handle_click_thread, logged_in_user } = this.props
        console.log(`[status] rendering ${status.id}`)
        const { user, community } = status
        return (
            <div className="status">
                <div className="inside">
                    <div className="status-left">
                        <a href={`/user/${user.name}`} className="avatar link">
                            <img src={user.avatar_url} className="image" />
                        </a>
                    </div>
                    <div className="status-right">
                        <div className="status-header">
                            <div className="inside">
                                <a href={`/user/${user.name}`} className="link">
                                    <StatusHeaderDisplayNameComponent user={user} />
                                    <StatusHeaderUserStatusComponent user={user} />
                                    <span className="name element">@{user.name}</span>
                                </a>
                                <StatusTimeComponent href={`/status/${user.name}/${status.id}`} string={this.state.elapsed_time_str} label={this.state.date_str} />
                            </div>
                        </div>
                        <div className="status-content">
                            <div className="body">{this.state.body}</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default class App extends AppComponent {
    constructor(props) {
        super(props)
        this.state = {
            "statuses": props.statuses.slice(0, 20)
        }
        ws.addEventListener("message", (e) => {
            const data = JSON.parse(e.data)
            if (data.status_updated) {
                const { status } = data
                const { community } = status
                if (community) {
                    console.log(status)
                    const { statuses } = this.state
                    statuses.unshift(status)
                    const new_statuses = statuses.slice(0, 20)
                    this.setState({ "statuses": new_statuses })
                }
            }
        })
    }
    render() {
        const { logged_in_user, platform } = this.props

        const statusViewList = []
        this.state.statuses.forEach(status => {
            if (status.deleted) {
                return
            }
            const options = new StatusOptions()
            options.trim_comments = true
            options.show_source_link = false
            const do_nothing = () => { }
            statusViewList.push(
                <StatusComponent status={status}
                    key={status.id}
                    options={options}
                    handle_click_channel={do_nothing}
                    handle_click_mention={do_nothing}
                    handle_click_thread={do_nothing}
                    logged_in_user={do_nothing} />
            )
        })
        return (
            <div>
                <Head title="Beluga" platform={platform} logged_in_user={logged_in_user} />
                <div className="top-component">
                    <p><strong>「Beluga」は、文章や画像、動画を投稿して楽しむチャット型SNSです。他のSNSにはない新しい機能が使えます。</strong></p>
                    <p>まず<a href="/signup">アカウントの登録</a>をしてください</p>
                    <p>次に<a href="/beluga/初心者">#初心者</a>に来てください</p>

                    <div className="column-component timeline">
                        <div className="inside">

                            <div className="timeline-header-component">
                                <div className="inside">
                                    <div className="label-area channel">
                                        <span className="icon community"></span>
                                        <span className="label">タイムライン</span>
                                    </div>
                                </div>
                            </div>

                            <div className="timeline-component webkit-scrollbar" ref="module">
                                <div className="inside">
                                    <div className="vertical-line"></div>
                                    {statusViewList}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}