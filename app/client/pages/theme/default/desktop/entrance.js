import { Component } from "react"
import HeaderComponent from "../../../../views/desktop/common/header"
import Head from "../../../../views/theme/default/desktop/head"
import AppComponent from "../../../../views/app"
import ws from "../../../../websocket"
import { StatusHeaderDisplayNameComponent, StatusHeaderUserStatusComponent } from "../../../../views/theme/default/desktop/status/header"
import { StatusTimeComponent } from "../../../../views/theme/default/desktop/status"
import { StatusOptions } from "../../../../stores/theme/default/common/status"
import { build_status_body_views } from "../../../../views/theme/default/desktop/parser"
import { created_at_to_elapsed_time, time_string_from_create_at, date_string_from_create_at } from "../../../../libs/date"
import { get_image_url_for_shortname, standard_shortnames_of_people } from "../../../../stores/theme/default/common/emoji"
import assign from "../../../../libs/assign"
import { to_hex_string } from "../../../../libs/functions"

const shuffle = array => {
    for (var i = array.length - 1; i > 0; i--) {
        var r = Math.floor(Math.random() * (i + 1));
        var tmp = array[i];
        array[i] = array[r];
        array[r] = tmp;
    }
    return array
}

const randint = (start, end) => {
    return Math.floor(Math.random() * (end - start)) + start
}

const slice = (array, number) => {
    if (array.length < number) {
        return array
    }
    const ret = []
    for (let k = 0; k < number; k++) {
        ret.push(array[k])
    }
    return ret
}

class SimpleStatusComponent extends Component {
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

class FeatureStatusComponent extends Component {
    constructor(props) {
        super(props)
        const { status, handle_click_channel, handle_click_mention, handle_click_thread } = props
        const { created_at } = status
        this.state = {
            "elapsed_time_str": created_at_to_elapsed_time(created_at),
            "created_at_str": time_string_from_create_at(created_at),
            "date_str": date_string_from_create_at(created_at),
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
    generateCommentersView = status => {
        const { options } = this.props
        const { comments_count, commenters } = status
        if (comments_count === 0) {
            return null
        }
        const commentersView = []
        commenters.forEach(user => {
            commentersView.push(
                <img src={user.avatar_url} className="avatar" />
            )
        })
        let preview_text = status.last_comment ? status.last_comment.text : ""
        if (preview_text.length > 100) {
            preview_text = preview_text.substr(0, 100)
        }
        preview_text = build_status_body_views(preview_text, null, {}, {})
        return (
            <a onClick={event => handle_click_thread(event, status.id)} className="status-body-commenters detail-row" href="/">
                <div className="commenters">{commentersView}</div>
                <div className="stats">
                    <span className="latest-comment">{preview_text}</span>
                    <span className="count">{comments_count}</span>
                    <span className="label">件のコメント</span>
                    <span className="arrow"></span>
                </div>
            </a>
        )
    }
    generateFavoritesView = status => {
        if (status.favorited_by.length === 0) {
            return null
        }
        const userViews = []
        status.favorited_by.forEach(user => {
            userViews.push(
                <a href={`/user/${user.name}`} target="_blank">
                    <img src={user.avatar_url} />
                </a>
            )
        })
        return (
            <div className="status-favofites detail-row">
                <div className="users">
                    {userViews}
                </div>
                <div className="meta">
                    <span className="sep"></span>
                    <span className="count">{status.favorited_by.length}</span>
                    <span className="unit">ふぁぼ</span>
                </div>
            </div>
        )
    }
    generateLikesView = status => {
        if (status.likes_count === 0) {
            return null
        }
        const starViews = []
        for (let i = 0; i < status.likes_count; i++) {
            starViews.push(<p></p>)
        }
        return <div className="status-likes detail-row">{starViews}</div>
    }
    generateReactionsView = status => {
        const { reactions } = status
        if (reactions.length == 0) {
            return null
        }
        const buttons = []
        reactions.forEach(reaction => {
            const { shortname } = reaction
            const image_url = get_image_url_for_shortname(shortname, null)
            const count = randint(1, 9)
            buttons.push(
                <button
                    className="status-reaction"
                    key={shortname}>
                    <span className="emoji emoji-sizer" style={{ "backgroundImage": `url(${image_url})` }}></span>
                    <span className="count">{count}</span>
                </button>
            )
        })
        return (
            <div className="status-reactions detail-row">
                {buttons}
            </div>
        )
    }
    render() {
        const { status, options, handle_click_channel, handle_click_mention, handle_click_thread, logged_in_user } = this.props
        const { text, user, community, entities } = status

        const bodyView = build_status_body_views(text, community, entities, { handle_click_channel, handle_click_mention, handle_click_thread })
        const likesView = this.generateLikesView(status)
        const favoritesView = this.generateFavoritesView(status)
        const commentsView = this.generateCommentersView(status)
        const reactionsView = this.generateReactionsView(status)

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
                            <div className="body">{bodyView}</div>
                        </div>
                        <div className="status-details">
                            {commentsView}
                            {likesView}
                            {favoritesView}
                            {reactionsView}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const FeatureLikeComponent = ({ status }) => {
    try {
        if (status == null) {
            return null
        }
        const do_nothing = () => { }
        const options = new StatusOptions()
        status.likes_count = randint(10, 40)
        return (
            <div className="feature">
                <h1 className="title like">いいね！</h1>
                <h2 className="description">好きな投稿に「いいね！」すると<span className="like"></span>が増えます</h2>
                <div className="status-area">
                    <FeatureStatusComponent status={status}
                        options={options}
                        handle_click_channel={do_nothing}
                        handle_click_mention={do_nothing}
                        handle_click_thread={do_nothing}
                        logged_in_user={do_nothing} />
                </div>
            </div>
        )
    } catch (error) {
        console.log(error)
        return null
    }
}

const FeatureFavoriteComponent = ({ status, users }) => {
    try {
        if (status == null) {
            return null
        }
        status.favorited_by = slice(shuffle(users), randint(2, 8))
        const do_nothing = () => { }
        const options = new StatusOptions()
        return (
            <div className="feature">
                <h1 className="title favorite">ふぁぼ</h1>
                <h2 className="description">投稿をお気に入りに登録できます</h2>
                <div className="status-area">
                    <FeatureStatusComponent status={status}
                        options={options}
                        handle_click_channel={do_nothing}
                        handle_click_mention={do_nothing}
                        handle_click_thread={do_nothing}
                        logged_in_user={do_nothing} />
                </div>
            </div>
        )
    } catch (error) {
        console.log(error)
        return null
    }
}

const FeatureReactionComponent = ({ status }) => {
    try {
        if (status == null) {
            return null
        }
        const do_nothing = () => { }
        const options = new StatusOptions()
        const random_shortnames = shuffle(standard_shortnames_of_people)
        const num_reactions = randint(3, 8)
        for (let k = 0; k < num_reactions; k++) {
            status.reactions.push({ "shortname": random_shortnames[k] })
        }
        return (
            <div className="feature">
                <h1 className="title reaction">リアクション</h1>
                <h2 className="description">投稿に絵文字を送ることができます</h2>
                <div className="status-area">
                    <FeatureStatusComponent status={status}
                        options={options}
                        handle_click_channel={do_nothing}
                        handle_click_mention={do_nothing}
                        handle_click_thread={do_nothing}
                        logged_in_user={do_nothing} />
                </div>
            </div>
        )
    } catch (error) {
        console.log(error)
        return null
    }
}

const FeatureCommentComponent = ({ status, comments }) => {
    try {
        if (status == null) {
            return null
        }
        if (comments.length === 0) {
            return null
        }
        const commenters = []
        const comments_count = randint(2, 6)
        const set = new Set()
        const latest_comment_candidates = []
        comments.forEach(status => {
            const { text, user } = status
            if (set.has(to_hex_string(user.id)) === false) {
                set.add(to_hex_string(user.id))
                commenters.push(user)
            }
            if (text.indexOf("http") !== -1) {
                return
            }
            if (text.length < 140) {
                latest_comment_candidates.push(status)
            }
        })
        if (latest_comment_candidates.length === 0) {
            return null
        }
        status.comments_count = comments_count
        status.commenters = slice(shuffle(commenters), randint(1, 5))
        status.last_comment = latest_comment_candidates[randint(0, latest_comment_candidates.length - 1)]

        const do_nothing = () => { }
        const options = new StatusOptions()
        return (
            <div className="feature">
                <h1 className="title comment">コメント</h1>
                <h2 className="description">投稿のコメント欄でもチャットを楽しむことができます</h2>
                <div className="status-area">
                    <FeatureStatusComponent status={status}
                        options={options}
                        handle_click_channel={do_nothing}
                        handle_click_mention={do_nothing}
                        handle_click_thread={do_nothing}
                        logged_in_user={do_nothing} />
                </div>
            </div>
        )
    } catch (error) {
        console.log(error)
        return null
    }
}

const remove_attributes = status => {
    if (status === null) {
        return null
    }
    status.reactions = []
    status.likes_count = 0
    status.favorited_by = []
    status.commenters = []
    status.comments_count = 0
    status.last_comment = ""
    return status
}

export default class App extends AppComponent {
    constructor(props) {
        super(props)
        this.state = {
            "statuses": props.statuses,
            "status_for_like": null,
            "status_for_favorite": null,
            "status_for_reaction": null,
            "status_for_comment": null,
        }
        if (typeof window !== "undefined") {
            setTimeout(() => {
                const statuses_for_feature = this.generateStatusesForFeature()
                this.setState({
                    "status_for_like": remove_attributes(statuses_for_feature[0]),
                    "status_for_favorite": remove_attributes(statuses_for_feature[1]),
                    "status_for_reaction": remove_attributes(statuses_for_feature[2]),
                    "status_for_comment": remove_attributes(statuses_for_feature[3]),
                })
            }, 0)
            setInterval(() => {
                const statuses_for_feature = this.generateStatusesForFeature()
                this.setState({
                    "status_for_like": remove_attributes(statuses_for_feature[0]),
                    "status_for_favorite": remove_attributes(statuses_for_feature[1]),
                    "status_for_reaction": remove_attributes(statuses_for_feature[2]),
                    "status_for_comment": remove_attributes(statuses_for_feature[3]),
                })
            }, 15000)
        }

        ws.addEventListener("message", (e) => {
            const data = JSON.parse(e.data)
            if (data.status_updated) {
                const { status } = data
                const { community } = status
                if (community) {
                    const { statuses } = this.state
                    statuses.unshift(status)
                    const new_statuses = statuses.slice(0, 30)
                    this.setState({ "statuses": new_statuses })
                }
            }
        })
    }
    generateStatusesForFeature = () => {
        const users = []
        const set = new Set()
        const status_candidates = []
        this.state.statuses.forEach(status => {
            const { text, user } = status
            if (set.has(to_hex_string(user.id)) === false) {
                set.add(to_hex_string(user.id))
                users.push(user)
            }
            if (text.indexOf("http") !== -1) {
                return
            }
            if (text.length < 140) {
                status.text = text.replace("\n", " ")
                status_candidates.push(status)
            }
        })
        this.users_for_favorite = users
        if (status_candidates.length < 4) {
            for (let k = 0; k < 4 - status_candidates.length; k++) {
                status_candidates.push(status_candidates[k])
            }
        }
        if (status_candidates.length === 0) {
            status_candidates = [null, null, null, null]
        }

        return shuffle(status_candidates)
    }
    render() {
        const { logged_in_user, platform } = this.props

        const statusViewList = []

        this.state.statuses.forEach(status => {
            if (status.deleted) {
                return
            }
            const do_nothing = () => { }
            const options = new StatusOptions()
            options.trim_comments = true
            options.show_source_link = false
            statusViewList.push(
                <SimpleStatusComponent status={status}
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
                <div className="welcome-component">
                    <div className="left-area">
                        <div className="inside">

                            <div className="hero">
                                <h1 className="title">BELUGAへようこそ</h1>
                                <form className="form" method="GET" action="/signup">
                                    <input type="hidden" name="redirect" value="/beluga/%E5%88%9D%E5%BF%83%E8%80%85" />
                                    <button className="button user-defined-gradient-bg-color user-defined-button-box-shadow-color">登録してはじめる</button>
                                    <a className="login-link" href="/login">ログインする</a>
                                </form>
                                <h2 className="description">BELUGAは、文章や画像、動画を投稿して楽しむチャット型SNSです</h2>
                                <p className="note">現在開発中のため未完成の部分が多いです</p>
                                <p className="note">旧サイトのユーザーはアカウントを作り直してください</p>
                            </div>

                            <div className="features-component">
                                <div className="header">
                                    <h1>特徴</h1>
                                    <h2>Belugaには他のSNSにはない新しい機能があります</h2>
                                </div>
                                <div className="features-grid">
                                    <div className="row">
                                        <FeatureLikeComponent status={this.state.status_for_like} />
                                        <FeatureFavoriteComponent status={this.state.status_for_favorite} users={this.users_for_favorite} />
                                    </div>
                                    <div className="row">
                                        <FeatureReactionComponent status={this.state.status_for_reaction} />
                                        <FeatureCommentComponent status={this.state.status_for_comment} comments={this.state.statuses} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="timeline-area">
                        <div className="multiple-columns-component multiple-columns-enabled">
                            <div className="column-component timeline">
                                <div className="inside round">

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
                </div>
            </div>
        )
    }
}