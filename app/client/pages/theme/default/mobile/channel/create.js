import Head from "../../../../../views/desktop/common/head"
import { request } from "../../../../../api"
import config from "../../../../../beluga.config"
import Component from "../../../../../views/app"

export default class App extends Component {
    create = event => {
        if (this.pending === true) {
            return
        }
        this.pending = true
        const name = this.refs.name.value
        if (name.length == 0) {
            alert("チャンネル名を入力してください")
            this.pending = false
            return
        }
        request
            .post("/channel/create", {
                name,
                "community_id": this.props.community.id,
            })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    this.pending = false
                    return
                }
                location.href = `/${this.props.community.name}/${name}`
            })
            .catch(error => {
                alert(error)
                this.pending = false
            })
    }
    render() {
        return (
            <div>
                <Head title="チャンネルの作成"></Head>
                <div>
                    <p>{this.props.community.display_name}(${this.props.community.name})</p>
                </div>
                <div>
                    <p>チャンネル名</p>
                    <p>{config.domain}/{this.props.community.name}/<input type="text" ref="name" /></p>
                </div>
                <div><button className="button" onClick={this.create}>作成</button></div>
            </div>
        )
    }
}