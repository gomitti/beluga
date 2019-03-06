import classnames from "classnames"
import CommunityDetailComponent from "../../../../../views/theme/default/desktop/column/community"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import Component from "../../../../../views/app"

export default class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "pending_create": false,
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
        if (this.state.pending_create === true) {
            return
        }
        this.setState({
            "pending_create": true
        })

        const { name, type } = this.state
        const { community } = this.props

        try {
            this.verifyName(name)
        } catch (error) {
            this.setState({
                "pending_create": false
            })
            alert(error.toString())
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

        request
            .post("/channel/create", Object.assign(attributes, {
                "name": name,
                "community_id": community.id,
            }))
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    return
                }
                location.href = `/${community.name}/${name}`
            })
            .catch(error => {
                alert(error)
            })
            .then(_ => {
                this.setState({
                    "pending_create": false
                })
            })
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
                <Head title={`チャンネルの作成 / ${config.site.name}`} platform={platform} />
                <NavigationbarComponent logged_in_user={logged_in_user} community={community} />
                <div className="create-channel-container">
                    <h1 className="title">チャンネルの作成</h1>
                    <div className="content">
                        <div className="community-information">
                            <div className="avatar">
                                <a href={`/${community.name}`}>
                                    <img className="image" src={community.avatar_url} />
                                </a>
                            </div>
                            <div className="name">
                                <a href={`/${community.name}`}>
                                    <h1>{community.display_name}</h1>
                                    <h2>{community.name}</h2>
                                </a>
                            </div>
                        </div>
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
                                <button className={classnames("button", {
                                    "in-progress": this.state.pending_create,
                                    "user-defined-bg-color": this.state.is_button_active,
                                    "neutral": !this.state.is_button_active,
                                })} onClick={this.create}>作成する</button>
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