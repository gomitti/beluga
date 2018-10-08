import { Component } from "react"
import Head from "next/head"

export default class App extends Component {

    static async getInitialProps({ query }) {
        return query
    }

    render() {
        return (
            <div className="catalogue">
                <Head>
                    <meta charSet="utf-8" />
                    <link rel="stylesheet" href="/css/common/colors.css" />
                    <title>色見本</title>
                </Head>
            </div>
        )
    }
}