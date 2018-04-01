import { Component } from "react"
import classnames from "classnames"
import CardView from "../../../../../views/theme/default/desktop/card/server"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"

export default class App extends Component {

    static async getInitialProps({ query }) {
        return query
    }

    constructor(props) {
        super(props)
        this.state = {
            "pending_create": false
        }
        if (request) {
            request.csrf_token = this.props.csrf_token
        }
    }

    verify = (tagname) => {
        if (tagname.length == 0) {
            throw new Error("ルーム名を入力してください")
        }
    }

    create = event => {
        if (this.state.pending_create === true) {
            return
        }
        this.setState({
            "pending_create": true
        })

        const tagname = this.refs.tagname.value
        const { server } = this.props

        try {
            this.verify(tagname)
        } catch (error) {
            this.setState({
                "pending_create": false
            })
            alert(error.toString())
            return
        }

        request
            .post("/hashtag/create", {
                tagname,
                "server_id": server.id,
            })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    return
                }
                location.href = `/server/${server.name}/${tagname}`
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
    render() {
        const { platform, server } = this.props
        return (
            <div id="app" className="create-hashtag">
                <Head title={`サーバーの作成 / ${config.site.name}`} platform={platform} />
                <NavigationBarView />
                <div className="create-hashtag-container">
                    <div className="content">
                        <CardView server={server} is_description_hidden={true} is_members_hidden={true} />
                    </div>
                    <h1 className="title">ルームの作成</h1>
                    <div className="content">
                        <div className="inside create-hashtag-form">
                            <div className="item">
                                <h3 className="title">ルーム名</h3>
                                <p className="input-container name">
                                    <input type="text" ref="tagname" className="form-input user-defined-border-color-focus" />
                                </p>
                            </div>
                            <div className="submit">
                                <button className={classnames("button user-defined-bg-color", { "in-progress": this.state.pending_create })} onClick={this.create}>作成する</button>
                            </div>
                        </div>
                    </div>
                    <div className="content">
                        <div className="inside">
                            <p className="create-hashtag-callout">
                                <span>他のルームを探しますか？</span>
                                <a href={`/server/${server.name}/hashtags`}>一覧を見る</a>
                            </p>
                            <p className="create-hashtag-callout">
                                <span>ルームとは？</span>
                                <a href="">ヘルプを見る</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}