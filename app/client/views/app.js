import { Component } from "react"
import Router from "next/router"
import { request } from "../api"
import { init as init_desktop_settings } from "../settings/desktop"
import * as EmojiPickerStore from "../stores/theme/default/common/emoji"
import ws from "../websocket"


export default class App extends Component {
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        const { custom_emoji_version, pinned_emoji_shortnames, custom_emoji_shortnames,
            community, desktop_settings, csrf_token } = props
        request.set_csrf_token(csrf_token)

        // custom_emoji_versionは絵文字の画像ファイルのブラウザキャッシュを強制的に消すために使う
        if (custom_emoji_version) {
            EmojiPickerStore.set_custom_emoji_version(custom_emoji_version)
        }
        if (pinned_emoji_shortnames) {
            const picker = EmojiPickerStore.shared_instance
            picker.setPinnedShortnames(pinned_emoji_shortnames)
        }
        if (community && custom_emoji_shortnames) {
            const picker = EmojiPickerStore.shared_instance
            picker.setShortnamesForCommunity(community.id, custom_emoji_shortnames)
            picker.setCommunityId(community.id)
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