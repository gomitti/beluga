import classnames from "classnames"
import Head from "../../../../../views/theme/default/mobile/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
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
        const { server, request_query } = this.props
        if (this.state.pending_join === true) {
            return
        }
        this.setState({
            "pending_join": true
        })
        request
            .post("/server/join", { "server_id": server.id })
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
                location.href = `/server/${server.name}/about`
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
        const { platform, server, members, device, logged_in_user } = this.props
        let membersView = null
        if (members.length > 0) {
            const memberListViews = []
            members.forEach(user => {
                memberListViews.push(
                    <li>
                        <a href={`/user/${user.name}`}>
                            <img src={user.avatar_url} />
                        </a>
                    </li>
                )
            })
            membersView = (
                <div className="members">
                    <h3 className="title"><span className="meiryo">メンバー</span> - <span className="verdana">{memberListViews.length}</span></h3>
                    <ul className="list">{memberListViews}</ul>
                </div>
            )
        }
        return (
            <div id="app" className="join-server">
                <Head title={`${server.display_name}に参加する / ${config.site.name}`} platform={platform} device={device} logged_in_user={logged_in_user} />
                <div className="join-server-container">
                    <div className="content">
                        <div className="server-information">
                            <div className="avatar">
                                <a href={`/server/${server.name}/about`}>
                                    <img className="image" src={server.avatar_url} />
                                </a>
                            </div>
                            <div className="name">
                                <a href={`/server/${server.name}/about`}>
                                    <h1>{server.display_name}</h1>
                                    <h2>{server.name}</h2>
                                </a>
                            </div>
                        </div>
                        <div className="join-form">
                            <p>あなたはまだ<b>{server.display_name}</b>に参加していません。</p>
                            <p><b>{server.display_name}</b>のチャンネルに投稿するには参加する必要があります。</p>
                            <div className="submit">
                                <button
                                    className={classnames("button meiryo ready user-defined-bg-color", { "in-progress": this.state.pending_join })}
                                    onClick={this.onJoin}>
                                    <span className="progress-text">参加する</span>
                                    <span className="display-text">参加する</span>
                                </button>
                                <button className="button meiryo neutral user-defined-bg-color" onClick={() => {
                                    location.href = `/server/${server.name}/about`
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