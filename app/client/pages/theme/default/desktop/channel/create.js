import classnames from "classnames"
import CommunityDetailComponent from "../../../../../views/theme/default/desktop/column/community"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import AppComponent from "../../../../../views/app"
import BannerComponent from "../../../../../views/theme/default/desktop/banner/community"
import Toast from "../../../../../views/theme/default/desktop/toast"
import { LoadingButton } from "../../../../../views/theme/default/desktop/button"

export default class App extends AppComponent {
    constructor(props) {
        super(props)
        this.state = {
            "in_progress": false,
            "is_button_active": false,
            "name": "",
            "type": 0
        }
    }
    verifyName = (name) => {
        if (name.length == 0) {
            throw new Error("チャンネル名を入力してください")
        }
    }
    create = event => {
        if (this.state.in_progress === true) {
            return
        }
        this.setState({
            "in_progress": true
        })

        const { name, type } = this.state
        const { community } = this.props

        try {
            this.verifyName(name)
        } catch (error) {
            this.setState({
                "in_progress": false
            })
            Toast.push(error.toString(), false)
            return
        }

        const attributes = {
            "is_public": true,
            "invitation_needed": false,
        }
        if (type === 1) {
            attributes.is_public = false
            attributes.invitation_needed = true
        }

        setTimeout(() => {
            request
                .post("/channel/create", Object.assign(attributes, {
                    "name": name,
                    "community_id": community.id,
                }))
                .then(res => {
                    const { error } = res.data
                    if (error) {
                        Toast.push(error, false)
                        return
                    }
                    location.href = `/${community.name}/${name}`
                })
                .catch(error => {
                    Toast.push(error.toString(), false)
                })
                .then(_ => {
                    this.setState({
                        "in_progress": false
                    })
                })
        }, 250)
    }
    onNameChange = event => {
        const name = event.target.value
        const is_button_active = name.length > 0
        this.setState({ name, is_button_active })
    }
    onTypeChange = event => {
        const type = parseInt(event.target.value)
        this.setState({ type })
    }
    render() {
        const { platform, community, logged_in_user } = this.props
        return (
            <div id="app" className="create-channel">
                <Head title={`チャンネルの作成 / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} community={community} />
                <Toast />
                <BannerComponent title="チャンネルの作成" community={community} />
                <div className="create-channel-container">
                    <div className="content">
                        <div className="inside create-channel-form">
                            <div className="item">
                                <h3 className="title">チャンネル名</h3>
                                <p className="input-container name">
                                    <input type="text"
                                        className="form-input user-defined-border-color-focus"
                                        value={this.state.name}
                                        onChange={this.onNameChange} />
                                </p>
                            </div>
                            <div className="item">
                                <h3 className="title">アクセスコントロール</h3>
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
                            <div className="submit">
                                <LoadingButton
                                    handle_click={this.create}
                                    is_loading={this.state.in_progress}
                                    is_neutral_color={!this.state.is_button_active}
                                    label="作成する" />
                            </div>
                        </div>
                    </div>
                    <div className="content">
                        <div className="inside">
                            <p className="create-channel-callout">
                                <span>他のチャンネルを探しますか？</span>
                                <a href={`/${community.name}/channels`}>一覧を見る</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}