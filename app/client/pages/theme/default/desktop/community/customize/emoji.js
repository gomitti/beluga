import { configure } from "mobx"
import classnames from "classnames"
import NavigationbarComponent from "../../../../../../views/theme/default/desktop/navigationbar"
import CommunityDetailComponent from "../../../../../../views/theme/default/desktop/column/community"
import Head from "../../../../../../views/theme/default/desktop/head"
import config from "../../../../../../beluga.config"
import { request } from "../../../../../../api"
import assert from "../../../../../../assert";
import { get_image_url_by_shortname_or_null, add_custom_shortnames } from "../../../../../../stores/theme/default/common/emoji";
import Component from "../../../../../../views/app"
import { objectid_equals } from "../../../../../../libs/functions";

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "pending_add": false,
        }
        const { custom_emoji_list } = props
        const shortnames = []
        custom_emoji_list.forEach(emoji => {
            shortnames.push(emoji.shortname)
        })
        add_custom_shortnames(shortnames)
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
        const { community } = this.props
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
            const data = new Blob([reader.result], { "type": "application/octet-stream" })
            const xhr = new XMLHttpRequest()
            xhr.responseType = "json"
            xhr.open("POST", "/api/v1/emoji/add")
            const formdata = new FormData()
            formdata.append("csrf_token", request.csrf_token)
            formdata.append("shortname", shortname)
            formdata.append("community_id", community.id)
            formdata.append("data", data)
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
            }
            xhr.send(formdata)
        }
        reader.readAsArrayBuffer(file)
    }
    onRemove = emoji_id => {
        request
            .post("/emoji/remove", { emoji_id })
            .then(res => {
                const data = res.data
                const { error } = data
                if (error) {
                    alert(error)
                    return
                }
            })
            .catch(error => {
                alert(error)
            })
    }
    render() {
        const { community, logged_in_user, platform, device, custom_emoji_list } = this.props
        const emojiListComponent = []
        custom_emoji_list.forEach(emoji => {
            const { shortname, user, id } = emoji
            const src = get_image_url_by_shortname_or_null(shortname, community.id)
            if (src === null) {
                return
            }
            emojiListComponent.push(
                <li className="item">
                    <div className="image-area">
                        <img className="image" src={src} />
                    </div>
                    <div className="shortname-area">
                        <span className="shortname">:{shortname}:</span>
                    </div>
                    <div className="actions-area">
                        {objectid_equals(logged_in_user.id, user.id) ?
                            <a className="remove-link" href="#" onClick={event => {
                                event.preventDefault()
                                this.onRemove(id)
                            }}>削除</a>
                            : null}
                    </div>
                </li>
            )
        })
        return (
            <div id="app" className="customize">
                <Head title={`絵文字の追加 / ${community.display_name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} device={device} />
                <NavigationbarComponent community={community} logged_in_user={logged_in_user} />
                <div id="content" className={classnames("timeline channels", { "logged_in_user": !!logged_in_user })}>
                    <div className="inside column-container">
                        <div className="column customize-emoji">
                            {community.only_admin_can_add_emoji === false || (objectid_equals(community.created_by, logged_in_user.id)) ?
                                <div className="inside column-component round form">
                                    <div className="content">
                                        <div className="settings-component form customize-emoji">
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
                                : null
                            }

                            <div className="inside column-component round custom-emoji-list">
                                <div className="content">
                                    <div className="custom-emoji-list-area">
                                        <ul>
                                            {emojiListComponent}
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