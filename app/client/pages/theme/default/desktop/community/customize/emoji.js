import { Component } from "react"
import classnames from "classnames"
import NavigationbarComponent from "../../../../../../views/theme/default/desktop/navigationbar"
import CommunityDetailComponent from "../../../../../../views/theme/default/desktop/column/community"
import Head from "../../../../../../views/theme/default/desktop/head"
import config from "../../../../../../beluga.config"
import { request } from "../../../../../../api"
import assert from "../../../../../../assert";
import { get_image_url_by_shortname_or_null, add_custom_shortnames } from "../../../../../../stores/theme/default/common/emoji";
import AppComponent from "../../../../../../views/app"
import { objectid_equals } from "../../../../../../libs/functions"
import Toast from "../../../../../../views/theme/default/desktop/toast"
import { LoadingButton } from "../../../../../../views/theme/default/desktop/button"

const ImageComponent = ({ src }) => {
    if (src) {
        return (
            <div className="image-area">
                <img src={src} className="image" />
            </div>
        )
    }
    return null
}
class FormComponent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "in_progress": false,
            "preview_url": null,
        }
    }
    add = event => {
        event.preventDefault()
        const { files } = this.refs.image_input
        if (files.length === 0) {
            return Toast.push("ファイルを選択してください", false)
        }
        if (files.length !== 1) {
            return Toast.push("ファイルを1つだけ選択してください", false)
        }
        const file = files[0]
        
        const shortname = this.refs.shortname.value
        if (shortname.length === 0) {
            return Toast.push("絵文字コードを入力してください", false)
        }
        this.setState({
            "in_progress": true
        })
        setTimeout(() => {
            const { community } = this.props
            const reader = new FileReader()
            reader.onabort = event => {
                this.setState({
                    "in_progress": false
                })
                Toast.push("中断されました", false)
            }
            reader.onerror = event => {
                this.setState({
                    "in_progress": false
                })
                Toast.push("不明なエラー", false)
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
                        Toast.push("接続できません", false)
                    }
                    const { error } = xhr.response
                    if (error) {
                        Toast.push(error, false)
                    } else {
                        Toast.push(`:${shortname}:が使用可能になりました`, true)
                        add_custom_shortnames([shortname])
                        const { callback_add } = this.props
                        if (callback_add) {
                            callback_add()
                        }
                        this.setState({
                            "preview_url": null
                        })
                        this.refs.shortname.value = ""
                        this.refs.image_input.value = null
                    }
                    this.setState({
                        "in_progress": false
                    })
                }
                xhr.send(formdata)
            }
            reader.readAsArrayBuffer(file)
        }, 250)
    }
    onInputeChange = event => {
        const { files } = event.target
        if (files && files.length == 1) {
            const file = files[0]
            const shortname = file.name.replace(/\.(png|jpeg|jpg|gif)$/, "")
            this.refs.shortname.value = shortname

            const reader = new FileReader()
            reader.onloadend = event => {
                const preview_url = reader.result
                this.setState({ preview_url })
            }
            reader.readAsDataURL(file)
        }
    }
    render() {
        return (
            <div className="column-component community-customize-emoji-form">
                <div className="inside round">
                    <div className="settings-content-component form">
                        <div className="head">
                            <h1 className="title">絵文字の追加</h1>
                        </div>

                        <div className="item upload-image">
                            <h3 className="title">1.画像をアップロード</h3>
                            <div className="dialog-area">
                                <ImageComponent src={this.state.preview_url} />
                                <div className="form-area">
                                    <input className="image-input" type="file" ref="image_input" onChange={this.onInputeChange} accept="image/*" />
                                    <p className="hint">64px以上128px以下の画像に対応しています</p>
                                </div>
                            </div>
                        </div>

                        <div className="item shortname">
                            <h3 className="title">2.絵文字コードを入力</h3>
                            <input className="form-input user-defined-border-color-focus" type="text" ref="shortname" />
                            <p className="hint">半角英数字のみ使えます</p>
                            <p className="hint">例: thinking_face</p>
                        </div>

                        <div className="submit">
                            <LoadingButton
                                is_loading={this.state.in_progress}
                                handle_click={this.add}
                                label="追加する" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const RemoveButton = ({ emoji_id, emoji_shortname, logged_in_user, user, handle_remove }) => {
    if (objectid_equals(logged_in_user.id, user.id)) {
        return (
            <a className="remove-link" href="#" onClick={event => {
                event.preventDefault()
                handle_remove(emoji_id, emoji_shortname)
            }}>削除</a>
        )
    }
    return null
}

const EmojiListComponent = ({ emoji_list, community, logged_in_user, handle_remove }) => {
    if (emoji_list.length == 0) {
        return null
    }
    const emojiListComponent = []
    emoji_list.forEach(emoji => {
        const { shortname, user, id } = emoji
        const src = get_image_url_by_shortname_or_null(shortname, community.id)
        if (src === null) {
            return
        }
        emojiListComponent.push(
            <li className="item" key={id}>
                <div className="image-area">
                    <img className="image" src={src} />
                </div>
                <div className="shortname-area">
                    <span className="shortname">:{shortname}:</span>
                </div>
                <div className="actions-area">
                    <RemoveButton
                        emoji_id={id}
                        emoji_shortname={shortname}
                        logged_in_user={logged_in_user}
                        user={user}
                        handle_remove={handle_remove} />
                </div>
            </li>
        )
    })
    return (
        <div className="column-component community-customize-emoji-list">
            <div className="inside round">
                <ul className="emoji-list">
                    {emojiListComponent}
                </ul>
            </div>
        </div>
    )
}

export default class App extends AppComponent {
    constructor(props) {
        super(props)
        const { custom_emoji_list } = props
        const shortnames = []
        custom_emoji_list.forEach(emoji => {
            shortnames.push(emoji.shortname)
        })
        add_custom_shortnames(shortnames)
        this.state = { custom_emoji_list }
    }
    shouldComponentUpdate = (nextProps, nextState) => {
        return this.state.custom_emoji_list.length != nextState.custom_emoji_list.length
    }
    reloadList = () => {
        const { community } = this.props
        request
            .get("/emoji/list", { "community_id": community.id })
            .then(res => {
                const { error, custom_emoji_list } = res.data
                if (error) {
                    Toast.push(error, false)
                    return
                }
                this.setState({ custom_emoji_list })
            })
            .catch(error => {
                Toast.push(error.toString(), false)
            })
    }
    onRemove = (id, shortname) => {
        request
            .post("/emoji/remove", { "emoji_id": id })
            .then(res => {
                const { error } = res.data
                if (error) {
                    Toast.push(error, false)
                    return
                }
                Toast.push(`:${shortname}:を削除しました`, true)
                this.reloadList()
            })
            .catch(error => {
                Toast.push(error.toString(), false)
            })
    }
    onAdd = () => {
        this.reloadList()
    }
    render() {
        const { community, logged_in_user, platform, device } = this.props
        return (
            <div className="app community-customize-emoji">
                <Head title={`絵文字の追加 / ${community.display_name} / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} device={device} />
                <NavigationbarComponent community={community} logged_in_user={logged_in_user} />
                <Toast />
                <div className={classnames("client", { "logged_in_user": !!logged_in_user })}>
                    <div className="inside">
                        <FormComponent
                            community={community}
                            callback_add={this.onAdd} />
                        <EmojiListComponent
                            emoji_list={this.state.custom_emoji_list}
                            community={community}
                            logged_in_user={logged_in_user}
                            handle_remove={this.onRemove} />
                    </div>
                </div>
            </div>
        )
    }
}