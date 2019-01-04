import { Component } from "react"
import Router from "next/router"
import { request } from "../api"
import { add_custom_shortnames } from "../stores/theme/default/common/emoji"
import { init as init_desktop_settings } from "../settings/desktop"


export default class App extends Component {
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        const { custom_emoji_shortnames, desktop_settings, csrf_token } = props

        request.set_csrf_token(csrf_token)

        if (custom_emoji_shortnames) {
            add_custom_shortnames(custom_emoji_shortnames)
        }
        init_desktop_settings(desktop_settings)

        // Safariのブラウザバック問題の解消
        if (typeof window !== "undefined") {
            Router.beforePopState(({ url, as, options }) => {
                return false
            })
        }
    }

}