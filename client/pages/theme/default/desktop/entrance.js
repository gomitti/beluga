import { Component } from "react"
import HeaderView from "../../../../views/desktop/common/header"
import Head from "../../../../views/desktop/common/head"

export default class App extends Component {
    // サーバー側でのみ呼ばれる
    // ここで返したpropsはクライアント側でも取れる
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        if (typeof history !== "undefined") {
            history.scrollRestoration = "manual"
        }
    }
    render() {
        const { hashtags, logged_in } = this.props
        const hashtagListView = hashtags ? hashtags.map(hashtag => {
            return <p><a href={`/server/${hashtag.server.name}/${hashtag.tagname}`}>${hashtag.server.name} / #{hashtag.tagname}</a></p>
        }) : null
        return (
            <div>
                <Head title="Beluga" />
                <HeaderView logged_in={logged_in} />
                {hashtagListView}
            </div>
        )
    }
}