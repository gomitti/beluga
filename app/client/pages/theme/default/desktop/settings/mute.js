import { Component } from "react"
import classnames from "classnames"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationbarView from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import Snackbar from "../../../../../views/theme/default/desktop/snackbar"
import AppComponent from "../../../../../views/app"

class MutedUserListComponent extends Component {
    render() {
        const { users, handle_destory } = this.props
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
                    <a href="#" className="destory-button" onClick={(event) => {
                        event.preventDefault()
                        handle_destory(user)
                    }}>解除</a>
                </li>
            )
        })
        return (
            <div className="list-component">
                <p className="description">以下のユーザーの投稿は表示されません</p>
                <ul className="list">
                    {listViews}
                </ul>
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
                    console.log(user)
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
class UserMuteComponent extends Component {
    constructor(props) {
        super(props)
        const { muted_users } = props
        this.state = {
            "name": "@",
            "match": [],
            "muted_users": muted_users,
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
        const { users } = this.props
        const query = this.state.name.replace("@", "")
        if (query === "") {
            this.setState({ "match": [], "complete_enabled": false })
            return
        }
        const regexp = new RegExp(query, "i")
        const match = []
        users.forEach(user => {
            if (regexp.test(user.name)) {
                match.push(user)
            }
        })
        this.setState({ match, "complete_enabled": true })
    }
    create = async event => {
        event.preventDefault()
        if (this.pending) {
            return
        }
        this.pending = true
        const { name } = this.state
        try {
            {
                const res = await request.post("/mute/user/create", {
                    "name": name.replace("@", "")
                })
                const { data } = res
                if (data.success == false) {
                    throw new Error(data.error)
                }
            }
            {
                const res = await request.get("/mute/user/list", {})
                const { data } = res
                if (data.success == false) {
                    throw new Error(data.error)
                }
                const { users } = data
                this.setState({ "name": "@", "match": [], "muted_users": users })
            }
            Snackbar.show("ミュートしました", false)
        } catch (error) {
            alert(error)
        }
        this.pending = false
    }
    destory = async user => {
        if (this.pending) {
            return
        }
        this.pending = true
        try {
            {
                const res = await request.post("/mute/user/destory", {
                    "id": user.id
                })
                const { data } = res
                if (data.success == false) {
                    throw new Error(data.error)
                }
            }
            {
                const res = await request.get("/mute/user/list", {})
                const { data } = res
                if (data.success == false) {
                    throw new Error(data.error)
                }
                const { users } = data
                this.setState({ "muted_users": users })
            }
            Snackbar.show("ミュートを解除しました", false)
        } catch (error) {
            alert(error)
        }
        this.pending = false
    }
    render = () => {
        const { users } = this.props
        const { match, muted_users } = this.state
        return (
            <div className="settings-module mute">
                <div className="head">
                    <h1>ユーザー</h1>
                </div>
                <div className="form-component">
                    <p className="description">ミュートしたいユーザーのユーザー名を入力してください</p>
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
                        <button className="button user-defined-bg-color" onClick={this.create}>追加する</button>
                    </div>
                    <MutedUserListComponent users={muted_users} handle_destory={this.destory} />
                </div>
            </div>
        )
    }
}

export default class App extends AppComponent {
    render() {
        const { platform, logged_in, users, muted_users } = this.props
        return (
            <div id="app" className="settings">
                <Head title={`ミュート / 設定 / ${config.site.name}`} platform={platform} logged_in={logged_in} />
                <NavigationbarView logged_in={logged_in} is_bottom_hidden={true} />
                <div className="settings-content">
                    <div className="inside">
                        <SettingsMenuView active="mute" />
                        <div className="settings-content-module">
                            <UserMuteComponent
                                logged_in={logged_in}
                                users={users}
                                muted_users={muted_users} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}