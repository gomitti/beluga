import { Component } from "react"
import Head from "../../../../../views/desktop/common/head"
import { request } from "../../../../../api"
import config from "../../../../../beluga.config"

export default class App extends Component {

    static async getInitialProps({ query }) {
        return query
    }

    constructor(props) {
        super(props)
        request.set_csrf_token(this.props.csrf_token)
    }

    create = event => {
        if (this.pending === true) {
            return
        }
        this.pending = true
        const tagname = this.refs.tagname.value
        if (tagname.length == 0) {
            alert("ルーム名を入力してください")
            this.pending = false
            return
        }
        request
            .post("/hashtag/create", {
                tagname,
                "server_id": this.props.server.id,
            })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    this.pending = false
                    return
                }
                location.href = `/server/${this.props.server.name}/${tagname}`
            })
            .catch(error => {
                alert(error)
                this.pending = false
            })
    }
    render() {
        return (
            <div>
                <Head title="ルームの作成"></Head>
                <div>
                    <p>{this.props.server.display_name}(${this.props.server.name})</p>
                </div>
                <div>
                    <p>ルーム名</p>
                    <p>{config.domain}/server/{this.props.server.name}/<input type="text" ref="tagname" /></p>
                </div>
                <div><button className="button" onClick={this.create}>作成</button></div>
            </div>
        )
    }
}