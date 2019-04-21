import { Component } from "react"
import { configure } from "mobx"
import classnames from "classnames"
import Head from "../../../../../../views/theme/default/desktop/head"
import NavigationbarComponent from "../../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuComponent from "../../../../../../views/theme/default/desktop/settings/channel/menu"
import BannerComponent from "../../../../../../views/theme/default/desktop/banner/channel"
import config from "../../../../../../beluga.config"
import { request } from "../../../../../../api"
import AppComponent from "../../../../../../views/app"
import assert, { is_array } from "../../../../../../assert"
import Toast from "../../../../../../views/theme/default/desktop/toast"
import { LoadingButton } from "../../../../../../views/theme/default/desktop/button"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

const event_types = {
    "type_updated": "__event_access_control_updated",
}

const dispatch_event = (eventName, opts) => {
    if (typeof window === "undefined") {
        return
    }
    let event
    if (typeof window.CustomEvent === "function") {
        event = new window.CustomEvent(eventName, { "detail": opts })
    } else {
        event = document.createEvent("Event")
        event.initEvent(eventName, false, true)
        event.detail = opts
    }
    window.dispatchEvent(event)
}

class AccessControlComponent extends Component {
    constructor(props) {
        super(props)
        const { channel } = props
        this.state = {
            "type": channel.invitation_needed ? 1 : 0
        }
        this.in_progress = false
    }
    onTypeChange = event => {
        if (this.in_progress === true) {
            return
        }
        this.in_progress = true

        const type = parseInt(event.target.value)
        this.setState({ type })

        const { channel } = this.props
        const attributes = {
            "is_public": true,
            "invitation_needed": false,
        }
        if (type === 1) {
            attributes.is_public = false
            attributes.invitation_needed = true
        }
        request
            .post("/channel/attribute/update", Object.assign(attributes, {
                "channel_id": channel.id
            }))
            .then(res => {
                const { success, error } = res.data
                if (success == false) {
                    Toast.push(error, false)
                } else {
                    Toast.push("チャンネル情報を保存しました", true)
                    dispatch_event(event_types.type_updated, { attributes })
                }
            })
            .catch(error => {
                Toast.push(error.toString(), false)
            })
            .then(_ => {
                this.in_progress = false
            })
    }
    render() {
        const { community } = this.props
        return (
            <div className="settings-content-component form channel-access-control">
                <div className="head">
                    <h1>アクセスコントロール</h1>
                </div>
                <div className="access-control">
                    <label className="choice">
                        <input name="access_control"
                            className="radio-button"
                            type="radio"
                            value="0"
                            onChange={this.onTypeChange}
                            checked={this.state.type === 0} />
                        <p className="name">公開</p>
                        <p className="description">すべてのユーザーが参加できるチャンネルです。投稿は<a href={`/${community.name}/statuses`}>パブリックタイムライン</a>に表示されます。</p>
                    </label>
                    <label className="choice">
                        <input name="access_control"
                            className="radio-button"
                            type="radio"
                            value="1"
                            onChange={this.onTypeChange}
                            checked={this.state.type === 1} />
                        <p className="name">承認制</p>
                        <p className="description">チャンネル管理者が承認したユーザーのみ投稿することができます。投稿は<a href={`/${community.name}/statuses`}>パブリックタイムライン</a>に表示されません。</p>
                    </label>
                </div>
            </div>
        )
    }
}

class UserCompleteComponent extends Component {
    render() {
        const { users, hidden, handle_select } = this.props
        if (users.length === 0) {
            return null
        }
        const listViews = []
        users.forEach(user => {
            listViews.push(
                <li className="user user-defined-transparent-bg-color-hover" key={user.id} onClick={event => {
                    event.stopPropagation()
                    event.preventDefault()
                    handle_select(user)
                }}>
                    <img className="avatar" src={user.avatar_url} />
                    <span className="name">{user.name}</span>
                    <span className="display-name">{user.display_name}</span>
                </li>
            )
        })
        return (
            <div className={classnames("complete-component", { "hidden": hidden })}>
                <ul className="list">{listViews}</ul>
            </div>
        )
    }
}

class ParticipantsComponent extends Component {
    render() {
        const { users, handle_kick, channel } = this.props
        if (users.length == 0) {
            return null
        }
        const listViews = []
        users.forEach(user => {
            listViews.push(
                <li className="user" key={user.id}>
                    <img className="avatar" src={user.avatar_url} />
                    <span className="name">{user.name}</span>
                    <span className="display-name">{user.display_name}</span>
                    {channel.created_by === user.id ? null :
                        <a href="#" className="kick-button" onClick={(event) => {
                            event.preventDefault()
                            handle_kick(user)
                        }}></a>
                    }
                </li>
            )
        })
        return (
            <div className="list-component">
                <p className="description">以下のユーザーはこのチャンネルに投稿することができます</p>
                <ul className="list">
                    {listViews}
                </ul>
            </div>
        )
    }
}

class InvitationComponent extends Component {
    constructor(props) {
        super(props)
        const { members_in_channel, members_in_community } = props
        assert(is_array(members_in_channel), "$members_in_channel must be of type array")
        assert(is_array(members_in_community), "$members_in_community must be of type array")

        this.state = {
            "name": "@",
            "match": [],
            "members": members_in_channel,
            "complete_enabled": false,
        }
        if (typeof document !== "undefined") {
            document.body.addEventListener("click", this.onDocumentClick)
        }
    }
    onInputChange = event => {
        let name = event.target.value
        name = "@" + name.replace(/@/g, "")
        this.setState({ name })
        if (this.timer_id) {
            clearTimeout(this.timer_id)
        }
        this.timer_id = setTimeout(this.search, 200)
    }
    onInputFocus = event => {
        this.setState({ "complete_enabled": true })
    }
    onDocumentClick = event => {
        if (event.target.className.indexOf("ignore-click") !== -1) {
            return
        }
        this.setState({ "complete_enabled": false })
    }
    onComplete = user => {
        const { name } = user
        this.setState({ "name": "@" + name })
    }
    search = () => {
        const { members_in_community } = this.props
        const query = this.state.name.replace("@", "")
        if (query === "") {
            this.setState({ "match": [], "complete_enabled": false })
            return
        }
        const regexp = new RegExp(query, "i")
        const match = []
        members_in_community.forEach(user => {
            if (regexp.test(user.name)) {
                match.push(user)
            }
        })
        this.setState({ match, "complete_enabled": true })
    }
    invite = async event => {
        event.preventDefault()
        if (this.pending) {
            return
        }
        this.pending = true
        const { channel } = this.props
        const { name } = this.state
        try {
            {
                const res = await request.post("/channel/invite", {
                    "user_name_to_invite": name.replace("@", ""),
                    "channel_id": channel.id
                })
                const { data } = res
                if (data.success == false) {
                    throw new Error(data.error)
                }
            }
            {
                const res = await request.get("/channel/members/list", {
                    "channel_id": channel.id
                })
                const { data } = res
                if (data.success == false) {
                    throw new Error(data.error)
                }
                const { members } = data
                this.setState({ "name": "@", "match": [], "members": members })
            }
        } catch (error) {
            alert(error)
        }
        this.pending = false
    }
    kick = async user => {
        if (this.pending) {
            return
        }
        this.pending = true
        const { channel } = this.props
        try {
            {
                const res = await request.post("/channel/kick", {
                    "user_id_to_kick": user.id,
                    "channel_id": channel.id
                })
                const { data } = res
                if (data.success == false) {
                    throw new Error(data.error)
                }
            }
            {
                const res = await request.get("/channel/members/list", {
                    "channel_id": channel.id
                })
                const { data } = res
                if (data.success == false) {
                    throw new Error(data.error)
                }
                const { members } = data
                this.setState({ "name": "@", "match": [], "members": members })
            }
        } catch (error) {
            alert(error)
        }
        this.pending = false
    }
    render = () => {
        const { users, channel } = this.props
        const { match, members } = this.state
        return (
            <div className="settings-content-component channel-access-control">
                <div className="head">
                    <h1>招待</h1>
                </div>
                <div className="form-component">
                    <p className="description">このチャンネルに招待するユーザーを入力してください</p>
                    <div className="username-component">
                        <div className="input-component">
                            <input type="text"
                                className="ignore-click form-input"
                                value={this.state.name}
                                onChange={this.onInputChange}
                                onFocus={this.onInputFocus} />
                            <UserCompleteComponent users={match}
                                hidden={!this.state.complete_enabled}
                                handle_select={this.onComplete} />
                        </div>
                        <LoadingButton is_loading={false} handle_click={this.invite} label="招待する" />
                    </div>
                    <ParticipantsComponent channel={channel} users={members} handle_kick={this.kick} />
                </div>
            </div>
        )
    }
}

export default class App extends AppComponent {
    constructor(props) {
        super(props)
        const { channel } = props
        this.state = {
            "invitation_needed": channel.invitation_needed
        }
        if (typeof window !== "undefined") {
            window.addEventListener(event_types.type_updated, this.onTypeUpdate)
        }
    }
    onTypeUpdate = (payload) => {
        const { detail } = payload
        const { attributes } = detail
        const { invitation_needed } = attributes
        this.setState({ invitation_needed })
    }
    render() {
        const { platform, logged_in_user, community, channel, members_in_channel, members_in_community } = this.props
        return (
            <div className="app channel-settings settings">
                <Head title={`情報を編集 / 設定 / ${community.name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} />
                <BannerComponent community={community} channel={channel} />
                <Toast />
                <div className="client">
                    <div className="inside">
                        <div className="settings-menu-area">
                            <SettingsMenuComponent active_page="access_control" community={community} channel={channel} />
                        </div>
                        <div className="settings-contents-area">
                            <AccessControlComponent
                                channel={channel}
                                community={community} />
                            {this.state.invitation_needed ?
                                <InvitationComponent
                                    members_in_channel={members_in_channel}
                                    members_in_community={members_in_community}
                                    channel={channel}
                                    community={community} />
                                : null}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}