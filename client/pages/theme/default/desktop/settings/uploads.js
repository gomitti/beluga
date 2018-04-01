import { Component } from "react"
import { configure } from "mobx"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationBarView from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import assert, { is_string } from "../../../../../assert"
import { request } from "../../../../../api"
import { created_at_to_elapsed_time } from "../../../../../libs/date"

const get_thumbnail_url_from_media = item => {
    if (item.is_video) {
        return `${item.uri}/${item.directory}/${item.prefix}.poster.jpg`
    }
    if (item.is_image) {
        return `${item.uri}/${item.directory}/${item.prefix}.small.${item.extension}`
    }
}

const convert_bytes_to_optimal_unit = bytes => {
    bytes /= 1024
    if (bytes < 1024) {
        return `${Math.floor(bytes)} KiB`
    }
    bytes /= 1024
    if (bytes < 1024) {
        return `${Math.floor(bytes)} MiB`
    }
    bytes /= 1024
    if (bytes < 1024) {
        return `${Math.floor(bytes)} GiB`
    }
    bytes /= 1024
    return `${Math.floor(bytes)} TiB`
}

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

export default class App extends Component {
    static async getInitialProps({ query }) {
        return query
    }
    constructor(props) {
        super(props)
        const { media } = props
        this.state = { media }
        if (request) {
            request.csrf_token = this.props.csrf_token
        }
        if (typeof history !== "undefined") {
            history.scrollRestoration = "manual"
        }
    }
    destroy = media_id => {
        request
            .post("/media/destroy", {
                "id": media_id
            })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                } else {
                    alert("削除しました")
                    const new_media = []
                    const { media } = this.state
                    for (const item of media) {
                        if (item.id === media_id) {
                            continue
                        }
                        new_media.push(item)
                    }
                    this.setState({
                        "media": new_media
                    })
                }
            })
            .catch(error => {
                alert(error)
            })
            .then(_ => {

            })
    }
    render() {
        const { platform, logged_in, aggregation_result } = this.props
        const { media } = this.state
        const bytes_unit_str = convert_bytes_to_optimal_unit(aggregation_result.total_bytes)
        return (
            <div id="app" className="settings">
                <Head title={`アップロード / 設定 / ${config.site.name}`} platform={platform} logged_in={logged_in} />
                <NavigationBarView logged_in={logged_in} is_bottom_hidden={true} />
                <div className="settings-content">
                    <div className="inside">
                        <SettingsMenuView active="uploads" />
                        <div className="settings-content-module">

                            <div className="settings-module form uploads-aggregation meiryo">
                                <div className="head">
                                    <h1>統計</h1>
                                </div>
                                <div className="table">
                                    <div className="row">
                                        <div className="key">ファイル数</div>
                                        <div className="value"><span className="bold">{aggregation_result.count}</span></div>
                                    </div>
                                    <div className="row">
                                        <div className="key">使用容量</div>
                                        <div className="value"><span className="bold">{bytes_unit_str}</span> ({aggregation_result.total_bytes.toLocaleString()} bytes)</div>
                                    </div>
                                </div>
                            </div>

                            {Array.isArray(media) && media.length > 0 ?
                                <div className="settings-module form uploads meiryo">
                                    <div className="head">
                                        <h1>ファイル一覧</h1>
                                    </div>
                                    <div className="file-list">
                                        {media.map(item => {
                                            const media_id = item.id.toString()
                                            const thumbnail_url = get_thumbnail_url_from_media(item)
                                            return (
                                                <div className="item" data-id={media_id} key={media_id}>
                                                    <div className="thumbnail">
                                                        <a href={item.source}>
                                                            <img src={thumbnail_url} />
                                                        </a>
                                                    </div>
                                                    <div className="information">
                                                        <div className="row">
                                                            <div className="key"><span className="bold">ファイルサイズ:</span></div>
                                                            <div className="value">{convert_bytes_to_optimal_unit(item.bytes)}</div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="key"><span className="bold">アップロード日:</span></div>
                                                            <div className="value">{created_at_to_elapsed_time(item.created_at)}</div>
                                                        </div>
                                                    </div>
                                                    <button className="tooltip-button button neutral delete" onClick={event => this.destroy(media_id)}>
                                                        <span className="tooltip"><span className="text">ファイルを削除します</span></span>
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                : null}
                                
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}