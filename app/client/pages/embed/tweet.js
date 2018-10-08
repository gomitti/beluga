import { Component } from "react"
import Head from "next/head"

export default class App extends Component {
    static async getInitialProps({ query }) {
        return query
    }
    render() {
        const { href } = this.props
        return (
            <div>
                <Head>
                    <meta charSet="utf-8" />
                    <link type="text/css" rel="stylesheet" href="https://platform.twitter.com/css/tweet.ab9101be6980fafdba47e88fa54bd311.light.ltr.css" />
                </Head>
                <blockquote class="twitter-tweet" data-lang="ja">
                    <p lang="ja" dir="ltr"><a href={href}></a></p>
                    <a href={href}></a>
                </blockquote>
                <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
            </div>
        )
    }
}