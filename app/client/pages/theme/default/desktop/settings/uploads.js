import { Component } from "react"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationbarComponent from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuComponent from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import assert, { is_string, is_object } from "../../../../../assert"
import { request } from "../../../../../api"
import { created_at_to_elapsed_time } from "../../../../../libs/date"
import { convert_bytes_to_optimal_unit } from "../../../../../libs/functions"
import Tooltip from "../../../../../views/theme/default/desktop/tooltip"
import AppComponent from "../../../../../views/app"
import Toast from "../../../../../views/theme/default/desktop/toast"

class TooltipButton extends Component {
    render() {
        const { handle_click } = this.props
        return (
            <button
                className="button neutral delete"
                onClick={handle_click}
                ref={dom => this.dom = dom}
                onMouseEnter={() => Tooltip.show(this.dom, "ファイルを削除します")}
                onMouseOver={() => Tooltip.show(this.dom, "ファイルを削除します")}
                onMouseOut={() => Tooltip.hide()}>
            </button>
        )
    }
}

const get_thumbnail_url_from_media = item => {
    if (item.is_video) {
        return `${item.uri}/${item.directory}/${item.prefix}.poster.jpg`
    }
    if (item.is_image) {
        return `${item.uri}/${item.directory}/${item.prefix}.small.${item.extension}`
    }
}

const StatsComponent = ({ aggregation_result }) => {
    const { total_bytes, count } = aggregation_result
    const bytes_unit_str = convert_bytes_to_optimal_unit(total_bytes)
    return (
        <div className="settings-content-component form uploads-aggregation">
            <div className="head">
                <h1>統計</h1>
            </div>
            <div className="table">
                <div className="row">
                    <div className="key">ファイル数</div>
                    <div className="value"><span className="bold">{count}</span></div>
                </div>
                <div className="row">
                    <div className="key">使用容量</div>
                    <div className="value"><span className="bold">{bytes_unit_str}</span> ({total_bytes.toLocaleString()} bytes)</div>
                </div>
            </div>
        </div>
    )
}

const MediaListComponentOrNull = ({ media, handle_click }) => {
    if (media.length === 0) {
        return null
    }
    return (
        <div className="settings-content-component form uploads">
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
                            <TooltipButton handle_click={event => handle_click(item.id)} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
export default class App extends AppComponent {
    constructor(props) {
        super(props)
        const { media } = props
        this.state = { media }
    }
    destroy = media_id => {
        if (window.confirm("削除しますか？")) {
            request
                .post("/media/destroy", {
                    "id": media_id
                })
                .then(res => {
                    const { success, error } = res.data
                    if (success == false) {
                        Toast.push(error, false)
                    } else {
                        Toast.push("削除しました", true)
                        const new_media = []
                        const { media } = this.state
                        media.forEach(item => {
                            if (item.id === media_id) {
                                return
                            }
                            new_media.push(item)
                        })
                        this.setState({
                            "media": new_media
                        })
                    }
                })
                .catch(error => {
                    Toast.push(error.toString(), false)
                })
        }
    }
    render() {
        const { platform, logged_in_user, aggregation_result } = this.props
        const { media } = this.state
        return (
            <div className="app settings">
                <Head title={`アップロード / 設定 / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarComponent logged_in_user={logged_in_user} is_bottom_hidden={true} />
                <Toast />
                <div className="client tooltip-offset-base emoji-picker-offset-base">
                    <div className="inside">
                        <div className="settings-menu-area">
                            <SettingsMenuComponent active_page="uploads" />
                        </div>
                        <div className="settings-contents-area">
                            <StatsComponent aggregation_result={aggregation_result} />
                            <MediaListComponentOrNull media={media} handle_click={this.destroy} />
                        </div>
                    </div>
                </div>
                <Tooltip />
            </div>
        )
    }
}