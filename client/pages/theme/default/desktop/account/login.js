import { Component } from "react"
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
        request.set_csrf_token(this.props.csrf_token)
    }
    signin = event => {
        event.preventDefault()
        if (this.pending === true) {
            return false
        }
        this.pending = true
        const name = this.refs.name.value
        const password = this.refs.password.value
        if (name.length == 0) {
            alert("ユーザー名を入力してください")
            this.pending = false
            return false
        }
        if (password.length == 0) {
            alert("パスワードを入力してください")
            this.pending = false
            return false
        }
        const { request_query } = this.props
        request
            .post("/account/signin", {
                name,
                "raw_password": password,
            })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    this.pending = false
                    return false
                }
                if (request_query && request_query.redirect) {
                    location.href = request_query.redirect
                    return
                }
                location.href = "/"
            })
            .catch(error => {
                alert(error)
                this.pending = false
            })
    }
    render() {
        const { platform } = this.props
        return (
            <div id="app" className="account">
                <Head title={`プロフィール / 設定 / ${config.site.name}`} platform={platform} />
                <NavigationBarView />
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
                                <button className="button user-defined-bg-color">ログイン</button>
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