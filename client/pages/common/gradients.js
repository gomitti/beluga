import { Component } from "react"
import Head from "next/head"

export default class App extends Component {

    static async getInitialProps({ query }) {
        return query
    }

    render() {
        const views = []
        for (let pair of this.props.gradients) {
            let start = pair[0]
            let end = pair[1]
            if (start.indexOf("#") !== 0) {
                start = "#" + start
            }
            if (end.indexOf("#") !== 0) {
                end = "#" + end
            }
            views.push(
                <div className="item">
                    <span className="code">{start}-{end}</span>
                    <div className="color" style={{
                        "backgroundImage": `linear-gradient(120deg, ${start} 0%, ${end} 100%)`
                    }}></div>
                </div>
            )
        }
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