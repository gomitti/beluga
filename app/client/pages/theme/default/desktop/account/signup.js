import { Component } from "react"
import Router from "next/router"
import classnames from "classnames"
import Head from "../../../../../views/theme/default/desktop/head"
import config from "../../../../../beluga.config"
import { request } from "../../../../../api"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import assert, { is_string } from "../../../../../assert"

export default class App extends Component {

    static async getInitialProps({ query }) {
        return query
    }

    constructor(props) {
        super(props)
        this.state = {
            "pending_signup": false
        }
        if (request) {
            const { csrf_token } = this.props
            assert(is_string(csrf_token), "$csrf_token must be of type string")
            request.csrf_token = csrf_token
        }

        // Safariのブラウザバック問題の解消
        if (typeof window !== "undefined") {
            Router.beforePopState(({ url, as, options }) => {
                return false
            });
        }
    }
    verify = (name, password, password_confirm) => {
        if (name.length == 0) {
            throw new Error("ユーザー名を入力してください")
        }
        if (password.length == 0) {
            throw new Error("パスワードを入力してください")
        }
        if (password !== password_confirm) {
            throw new Error("パスワードを正しく再入力してください")
        }
        if (name === password) {
            throw new Error("ユーザー名をパスワードに使用してはいけません")
        }
    }
    signup = event => {
        if (this.state.pending_signup === true) {
            return
        }
        this.setState({
            "pending_signup": true
        })

        const name = this.refs.name.value
        const password = this.refs.password.value
        const password_confirm = this.refs.confirm_password.value
        try {
            this.verify(name, password, password_confirm)
        } catch (error) {
            this.setState({
                "pending_signup": false
            })
            alert(error.toString())
            return
        }

        request
            .post("/account/signup", {
                name,
                "raw_password": password,
            })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    return
                }
                location.href = "/"
            })
            .catch(error => {
                alert(error)
            })
            .then(_ => {
                this.setState({
                    "pending_signup": false
                })
            })
    }
    render() {
        const { platform } = this.props
        return (
            <div id="app" className="account">
                <Head title={`プロフィール / 設定 / ${config.site.name}`} platform={platform} />
                <NavigationBarView />
                <div className="account-container">
                    <h1 className="title">アカウントの作成</h1>
                    <div className="content">
                        <div className="inside account-form">
                            <div className="item">
                                <h3 className="title">ユーザー名</h3>
                                <p className="input-container">
                                    <input type="text" ref="name" className="form-input user-defined-border-color-focus" />
                                </p>
                                <p className="hint">半角英数字と_のみ使用できます</p>
                            </div>
                            <div className="item">
                                <h3 className="title">パスワード</h3>
                                <p className="input-container password">
                                    <input type="password" ref="password" className="form-input user-defined-border-color-focus" />
                                </p>
                                <p className="hint">72文字までの半角英数字と記号のみ使用できます</p>
                            </div>
                            <div className="item">
                                <h3 className="title">パスワードを再入力してください</h3>
                                <p className="input-container password">
                                    <input type="password" ref="confirm_password" className="form-input user-defined-border-color-focus" />
                                </p>
                            </div>
                            <div className="submit">
                                <button className={classnames("button user-defined-bg-color", { "in-progress": this.state.pending_signup })} onClick={this.signup}>登録する</button>
                            </div>
                        </div>
                    </div>
                    <div className="content">
                        <div className="inside">
                            <p className="create-account-callout">
                                <span>すでに登録していますか？</span>
                                <a href="/login">ログイン</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}