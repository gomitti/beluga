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
            "pending_create": false
        }
    }
    verify = (name, display_name) => {
        if (name.length == 0) {
            throw new Error("コミュニティ名を入力してください")
        }
        if (display_name.length == 0) {
            throw new Error("表示名を入力してください")
        }
    }
    create = event => {
        if (this.state.pending_create === true) {
            return
        }
        this.setState({
            "pending_create": true
        })

        const name = this.refs.name.value
        const display_name = this.refs.displayName.value

        try {
            this.verify(name, display_name)
        } catch (error) {
            this.setState({
                "pending_create": false
            })
            alert(error.toString())
            return
        }

        request
            .post("/community/create", {
                name,
                display_name,
            })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    return
                }
                location.href = `/${data.community.name}`
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
        const { platform, logged_in_user } = this.props
        return (
            <div className="app create-community">
                <Head title={`コミュニティの作成 / ${config.site.name}`} platform={platform} />
                <NavigationbarComponent logged_in_user={logged_in_user} />
                <div className="create-community-component">
                    <h1 className="title">コミュニティの作成</h1>
                    <div className="contents">
                        <div className="inside create-community-form">
                            <div className="item">
                                <h3 className="title">名前</h3>
                                <p className="input-area name">
                                    <span className="prefix">{config.domain}/</span>
                                    <input type="text" ref="name" className="form-input user-defined-border-color-focus" />
                                </p>
                                <p className="hint">半角英数字のみ使用できます</p>
                                <p className="hint">URLに使用されます</p>
                            </div>
                            <div className="item">
                                <h3 className="title">表示名</h3>
                                <p className="input-area display-name">
                                    <input type="text" ref="displayName" className="form-input user-defined-border-color-focus" />
                                </p>
                                <p className="hint">実際にサイト上で表示される名前です</p>
                            </div>
                            <div className="submit">
                                <button className={classnames("button user-defined-bg-color", { "in-progress": this.state.pending_create })} onClick={this.create}>作成する</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}