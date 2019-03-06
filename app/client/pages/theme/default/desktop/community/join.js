import classnames from "classnames"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import Component from "../../../../../views/app"

export default class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "pending_join": false
        }
    }
    onJoin = event => {
        event.preventDefault()
        const { community, request_query } = this.props
        if (this.state.pending_join === true) {
            return
        }
        this.setState({
            "pending_join": true
        })
        request
            .post("/join", { "community_id": community.id })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    return
                }
                if (request_query && request_query.redirect) {
                    if (request_query.redirect.match(/^\/.+$/)) {
                        location.href = request_query.redirect
                        return
                    }
                }
                location.href = `/${community.name}`
            })
            .catch(error => {
                alert(error)
            })
            .then(_ => {
                this.setState({
                    "pending_join": false
                })
            })
    }
    render() {
        const { platform, community, members } = this.props
        let membersView = null
        if (members.length > 0) {
            const memberListComponents = []
            members.forEach(user => {
                memberListComponents.push(
                    <li>
                        <a href={`/user/${user.name}`}>
                            <img src={user.avatar_url} />
                        </a>
                    </li>
                )
            })
            membersView = (
                <div className="members">
                    <h3 className="title"><span className="meiryo">メンバー</span> - <span className="verdana">{memberListComponents.length}</span></h3>
                    <ul className="list">{memberListComponents}</ul>
                </div>
            )
        }
        return (
            <div className="app join-community">
                <Head title={`${community.display_name}に参加する / ${config.site.name}`} platform={platform} />
                <NavigationbarComponent />
                <div className="join-community-container">
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
                        <div className="join-form">
                            <p>あなたはまだ<b>{community.display_name}</b>に参加していません。</p>
                            <p><b>{community.display_name}</b>のチャンネルに投稿するには参加する必要があります。</p>
                            <div className="submit">
                                <button
                                    className={classnames("button meiryo ready user-defined-bg-color", { "in-progress": this.state.pending_join })}
                                    onClick={this.onJoin}>
                                    <span className="progress-text">参加する</span>
                                    <span className="display-text">参加する</span>
                                </button>
                                <button className="button meiryo neutral user-defined-bg-color" onClick={() => {
                                    location.href = `/${community.name}`
                                }}>
                                    <span className="display-text">詳細を見る</span>
                                </button>
                            </div>
                        </div>
                        {membersView}
                    </div>
                </div>
            </div>
        )
    }
}