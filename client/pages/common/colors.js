import { Component } from "react"
import Head from "next/head"

export default class App extends Component {

    static async getInitialProps({ query }) {
        return query
    }

    render() {
        const views = []
        this.props.colors.forEach(color => {
            if (color.indexOf("#") !== 0) {
                color = "#" + color
            }
            views.push(
                <div className="item">
                    <span className="code">{color}</span>
                    <div className="color" style={{
                        "backgroundColor": color
                    }}></div>
                </div>
            )
        })
        return (
            <div className="catalogue">
                <Head>
                    <meta charSet="utf-8" />
                    <link rel="stylesheet" href="/css/common/colors.css" />
                    <title>色見本</title>
                </Head>
                {views}
            </div>
        )
    }
}