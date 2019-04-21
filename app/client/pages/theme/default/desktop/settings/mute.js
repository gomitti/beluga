import { Component } from "react"
import classnames from "classnames"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuComponent from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import AppComponent from "../../../../../views/app"
import Toast from "../../../../../views/theme/default/desktop/toast"
import { LoadingButton } from "../../../../../views/theme/default/desktop/button"

const timeout = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class MutedUserListComponent extends Component {
    render() {
        const { users, handle_destory } = this.props
        if (users.length == 0) {
            return null
        }
        const listViews = []
        users.forEach(user => {
            const display_name = user.display_name ? user.display_name : user.name
            listViews.push(
                <li className="user" key={user.id}>
                    <img className="avatar" src={user.avatar_url} />
                    <span className="display-name">{display_name}</span>
                    <span className="name">{`@${user.name}`}</span>
                    <a href="#" className="destory-button" onClick={(event) => {
                        event.preventDefault()
                        handle_destory(user)
                    }}>解除する</a>
                </li>
            )
        })
        return (
            <div className="muted-user-list-component">
                <p className="description">以下のユーザーの投稿は表示されません</p>
                <ul className="list">
                    {listViews}
                </ul>
            </div>
        )
    }
}

const UserCompleteComponent = ({ users, is_hidden, handle_select }) => {
    if (users.length === 0) {
        return null
    }
    const listViews = []
    users.forEach(user => {
        const display_name = user.display_name ? user.display_name : user.name
        listViews.push(
            <li className="user" key={user.id} onClick={event => {
                event.stopPropagation()
                event.preventDefault()
                handle_select(user)
            }}>
                <img className="avatar" src={user.avatar_url} />
                <span className="display-name">{display_name}</span>
                <span className="name">{`@${user.name}`}</span>
            </li>
        )
    })
    return (
        <div className={classnames("complete-component", { "hidden": is_hidden })}>
            <ul className="list">{listViews}</ul>
        </div>
    )
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
            "in_progress": false
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
        this.setState({ "name": "@" + name, "complete_enabled": false, "match": [] })
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
        if (this.state.in_progress) {
            return
        }
        this.setState({ "in_progress": true })
        await timeout(250)
        const { name } = this.state
        try {
            {
                const res = await request.post("/mute/user/create", {
                    "user_name_to_mute": name.replace("@", "")
                })
                const { success, error } = res.data
                if (success == false) {
                    throw new Error(error)
                }
            }
            {
                const res = await request.get("/mute/users/list", {})
                const { success, error, users } = res.data
                if (success == false) {
                    throw new Error(error)
                }
                this.setState({ "name": "@", "match": [], "muted_users": users })
            }
            Toast.push(`${name}をミュートしました`, true)
        } catch (error) {
            Toast.push(error.toString(), false)
        }
        this.setState({ "in_progress": false })
    }
    destory = async user => {
        if (this.state.in_progress) {
            return
        }
        this.setState({ "in_progress": true })
        try {
            {
                const res = await request.post("/mute/user/destory", {
                    "user_id_to_mute": user.id
                })
                const { success, error } = res.data
                if (success == false) {
                    throw new Error(error)
                }
            }
            {
                const res = await request.get("/mute/users/list", {})
                const { success, error, users } = res.data
                if (success == false) {
                    throw new Error(error)
                }
                this.setState({ "muted_users": users })
            }
            Toast.push(`@${user.name}のミュートを解除しました`, true)
        } catch (error) {
            Toast.push(error.toString(), false)
        }
        this.setState({ "in_progress": false })
    }
    render = () => {
        const { users } = this.props
        const { match, muted_users } = this.state
        return (
            <div className="settings-content-component mute user-mute">
                <div className="head">
                    <h1>ユーザー</h1>
                </div>
                <div className="form-component">
                    <p className="description">ミュートしたいユーザーのユーザー名を入力してください</p>
                    <div className="username-component">
                        <div className="input-component">
                            <input
                                type="text"
                                className="ignore-click form-input user-defined-border-color-focus"
                                value={this.state.name}
                                onChange={this.onInputChange}
                                onFocus={this.onInputFocus} />
                            <UserCompleteComponent users={match}
                                hidden={!this.state.complete_enabled}
                                handle_select={this.onComplete} />
                        </div>
                        <div className="submit" style={{ "opacity": this.state.name.replace("@", "").length > 0 ? 1 : 0 }}>
                            <LoadingButton
                                handle_click={this.create}
                                is_loading={this.state.in_progress}
                                label="ミュートする" />
                        </div>
                    </div>
                    <MutedUserListComponent users={muted_users} handle_destory={this.destory} />
                </div>
            </div>
        )
    }
}

class WordMuteComponent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "in_progress": false
        }
    }
    update = async event => {
        event.preventDefault()
        if (this.state.in_progress) {
            return
        }
        this.setState({ "in_progress": true })
        await timeout(250)
        const words_str = this.refs.textarea.value
        const tmp_word_array = words_str.split(/\r?\n/)
        let joined_words_str = ""
        tmp_word_array.forEach(str => {
            if (str.length === 0) {
                return
            }
            joined_words_str += str + ","
        })
        try {
            const res = await request.post("/mute/words/update", {
                "words": joined_words_str
            })
            const { success, error } = res.data
            if (success == false) {
                throw new Error(error)
            }
            Toast.push("保存しました", true)
        } catch (error) {
            Toast.push(error.toString(), false)
        }
        this.setState({ "in_progress": false })
    }
    render() {
        const { muted_words } = this.props
        let text = ""
        muted_words.forEach(str => {
            text += str + "\n"
        })
        return (
            <div className="settings-content-component mute word-mute">
                <div className="head">
                    <h1>ワード</h1>
                </div>
                <div className="form-component">
                    <p className="description">表示したくない単語を改行で区切って入力してください</p>
                    <textarea className="words form-input user-defined-border-color-focus" ref="textarea">{text}</textarea>
                    <div className="submit">
                        <LoadingButton
                            handle_click={this.update}
                            is_loading={this.state.in_progress}
                            label="保存する" />
                    </div>
                </div>
            </div>
        )
    }
}

export default class App extends AppComponent {
    render() {
        const { platform, logged_in_user, users, muted_users, muted_words } = this.props
        return (
            <div className="app settings">
                <Head title={`ミュート / 設定 / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} is_bottom_hidden={true} />
                <Toast />
                <div className="client">
                    <div className="inside">
                        <div className="settings-menu-area">
                            <SettingsMenuComponent active_page="mute" />
                        </div>
                        <div className="settings-contents-area">
                            <UserMuteComponent
                                logged_in_user={logged_in_user}
                                users={users}
                                muted_users={muted_users} />
                            <WordMuteComponent muted_words={muted_words} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}