import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import Component from "../../../../../views/app"
import { LoadingButton } from "../../../../../views/theme/default/desktop/button"

export default class App extends Component {
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        this.state = {
            "in_progress": false
        }
    }
    signin = async event => {
        event.preventDefault()
        if (this.state.in_progress === true) {
            return false
        }
        this.setState({
            "in_progress": true
        })
        try {
            const name = this.refs.name.value
            const password = this.refs.password.value
            if (name.length == 0) {
                throw new Error("ユーザー名を入力してください")
            }
            if (password.length == 0) {
                throw new Error("パスワードを入力してください")
            }
            const { request_query } = this.props
            const res = await request.post("/account/signin", {
                name,
                "raw_password": password,
            })
            const { success, error } = res.data
            if (success == false) {
                throw new Error(error)
            }
            if (request_query && request_query.redirect) {
                if (request_query.redirect.match(/^\/.+$/)) {
                    return location.href = request_query.redirect
                }
            }
            return location.href = "/communities"
        } catch (error) {
            alert(error.toString())
        }
        this.setState({
            "in_progress": false
        })
    }
    render() {
        const { platform } = this.props
        return (
            <div className="app account">
                <Head title={`プロフィール / 設定 / ${config.site.name}`} platform={platform} />
                <NavigationbarComponent />
                <div className="account-container">
                    <h1 className="title">{config.site.name}にログイン</h1>
                    <div className="content">
                        <form className="inside account-form" method="post" action="/" ref="form" onSubmit={this.signin}>
                            <div className="item">
                                <h3 className="title">ユーザー名</h3>
                                <p className="input-container">
                                    <input type="text" name="name" ref="name" className="form-input user-defined-border-color-focus" />
                                </p>
                            </div>
                            <div className="item">
                                <h3 className="title">パスワード</h3>
                                <p className="input-container password">
                                    <input type="password" name="password" ref="password" className="form-input user-defined-border-color-focus" />
                                </p>
                            </div>
                            <div className="submit">
                                <LoadingButton is_loading={this.state.in_progress} label="ログイン" />
                            </div>
                        </form>
                    </div>
                    <div className="content">
                        <div className="inside">
                            <p className="create-account-callout">
                                <span>{config.site.name}は初めてですか？</span>
                                <a href="/signup">新規登録</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}