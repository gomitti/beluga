import { Component } from "react"
import { configure } from "mobx"
import classnames from "classnames"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../views/theme/default/desktop/settings/hashtag/menu"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        if (request) {
            request.csrf_token = this.props.csrf_token
        }
        if (typeof history !== "undefined") {
            history.scrollRestoration = "manual"
        }
    }
    componentDidMount() {
        // stateで管理するのはあまり好きではない
        const { hashtag } = this.props
        this.refs.tagname.value = hashtag.tagname || ""
    }
    onUpdateProfile = event => {
        const tagname = this.refs.tagname.value
        if (this.pending === true) {
            return
        }
        const { server } = this.props
        this.pending = true
        request
            .post("/server/profile/update", {
                "server_id": server.id,
                display_name,
                description,
            })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                } else {
                    alert("保存しました")
                    server.display_name = data.server.display_name
                }
            })
            .catch(error => {
                alert(error)
            })
            .then(_ => {
                this.pending = false
            })
    }
    render() {
        const { platform, logged_in, server, hashtag } = this.props
        return (
            <div id="app" className="hashtag-settings settings">
                <Head title={`情報を編集 / 設定 / ${server.name} / ${config.site.name}`} platform={platform} logged_in={logged_in} />
                <NavigationBarView logged_in={logged_in} is_bottom_hidden={true} />
                <div className="settings-content">
                    <div className="inside">
                        <SettingsMenuView active="profile" server={server} hashtag={hashtag} />
                        <div className="settings-content-module">
                            <div className="settings-module form profile meiryo">
                                <div className="head">
                                    <h1>情報を編集</h1>
                                </div>

                                <div className="item">
                                    <h3 className="title">ルーム名</h3>
                                    <input className="form-input user-defined-border-color-focus" type="text" ref="tagname" />
                                </div>

                                <div className="submit">
                                    <button className="button user-defined-bg-color" onClick={this.onUpdateProfile}>変更を保存</button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}