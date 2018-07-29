import { Component } from "react"
import { configure } from "mobx"
import classnames from "classnames"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import ServerDetailView from "../../../../../views/theme/default/desktop/column/server"
import Head from "../../../../../views/theme/default/desktop/head"
import TimelineStore from "../../../../../stores/theme/default/desktop/timeline/server"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import assert from "../../../../../assert";
import { get_image_url_from_shortname } from "../../../../../stores/emoji";

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {

    // サーバー側でのみ呼ばれる
    // ここで返したpropsはクライアント側でも取れる
    static async getInitialProps({ query }) {
        return query
    }

    constructor(props) {
        super(props)

        this.state = {
            "pending_add": false,
        }

        request.set_csrf_token(this.props.csrf_token)
        if (typeof history !== "undefined") {
            history.scrollRestoration = "manual"
        }
    }

    onFileChange = event => {

    }

    add = event => {
        event.preventDefault()
        const { files } = this.refs.image_input
        if (files.length === 0) {
            return alert("ファイルを選択してください")
        }
        if (files.length !== 1) {
            return alert("ファイルを1つだけ選択してください")
        }
        const file = files[0]

        const shortname = this.refs.shortname.value
        if (shortname.length === 0) {
            return alert("タグ名を入力してください")
        }
        this.setState({
            "pending_add": true
        })
        const { server } = this.props
        const reader = new FileReader()
        reader.onabort = event => {
            this.setState({
                "pending_add": false
            })
            return alert("中断されました")
        }
        reader.onerror = event => {
            this.setState({
                "pending_add": false
            })
            return alert("エラー")
        }
        reader.onloadend = event => {
            const blob = new Blob([reader.result], { "type": "application/octet-stream" })
            const xhr = new XMLHttpRequest()
            xhr.responseType = "json"
            xhr.open("POST", "/api/v1/emoji/add")
            const formdata = new FormData()
            formdata.append("csrf_token", request.csrf_token)
            formdata.append("shortname", shortname)
            formdata.append("server_id", server.id)
            formdata.append("data", new Blob([reader.result], { "type": "application/octet-stream" }))
            xhr.onload = () => {
                if (xhr.status !== 200) {
                    this.setState({
                        "pending_add": false
                    })
                    return alert("接続できません")
                }
                const data = xhr.response
                if (data.error) {
                    this.setState({
                        "pending_add": false
                    })
                    return alert(data.error)
                }
                this.setState({
                    "pending_add": false
                })
                alert("追加しました")
            }
            xhr.send(formdata)
        }
        reader.readAsArrayBuffer(file)
    }

    render() {
        const { server, logged_in, platform, device, custome_emoji } = this.props
        const emojiListView = []
        custome_emoji.forEach(emoji => {
            const { shortname, user } = emoji
            const src = get_image_url_from_shortname(shortname, server.id)
            emojiListView.push(
                <li className="item">
                    <div className="image-area">
                        <img className="image" src={src} />
                    </div>
                    <div className="shortname-area">
                        <span className="shortname">{shortname}</span>
                    </div>
                    <div className="user-area">
                        <img className="avatar" src={user.avatar_url} />
                        <a className="name" href={`/server/${server.name}/@${user.name}`}>@{user.name}</a>
                    </div>
                </li>
            )
        })
        return (
            <div id="app" className="customize">
                <Head title={`絵文字の追加 / ${server.display_name} / ${config.site.name}`} platform={platform} logged_in={logged_in} device={device} />
                <NavigationBarView server={server} logged_in={logged_in} />
                <div id="content" className={classnames("timeline hashtags", { "logged_in": !!logged_in })}>
                    <div className="inside column-container">
                        <div className="column customize-emoji">
                            <div className="inside server-container round">
                                <div className="content">
                                    <div className="settings-module form">
                                        <div className="head">
                                            <h1 className="title">絵文字の追加</h1>
                                        </div>

                                        <div className="item">
                                            <h3 className="title">コード</h3>
                                            <input className="form-input user-defined-border-color-focus" type="text" ref="shortname" />
                                            <p className="hint">半角英数字のみ使えます</p>
                                        </div>

                                        <div className="item">
                                            <h3 className="title">画像</h3>
                                            <input className="image-input" type="file" ref="image_input" accept="image/*" />
                                            <p className="hint">64px以上128px以下の正方形の画像に対応しています</p>
                                        </div>

                                        <div className="submit">
                                            <button
                                                className={classnames("button ready user-defined-bg-color", {
                                                    "in-progress": this.state.pending_add,
                                                })}
                                                onClick={this.add}>
                                                <span className="progress-text">追加する</span>
                                                <span className="display-text">追加する</span>
                                            </button>
                                        </div>

                                    </div>

                                </div>
                            </div>

                            <div className="inside server-container round">
                                <div className="content">
                                    <div className="section custome-emoji-list">
                                        <ul>
                                            {emojiListView}
                                        </ul>
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