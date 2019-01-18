import { Component } from "react"
import { configure } from "mobx"
import Head from "../../../../../views/theme/default/desktop/head"
import NavigationbarView from "../../../../../views/theme/default/desktop/navigationbar"
import SettingsMenuView from "../../../../../views/theme/default/desktop/settings/account/menu"
import config from "../../../../../beluga.config"
import assert, { is_string, is_object } from "../../../../../assert"
import { request } from "../../../../../api"
import { created_at_to_elapsed_time } from "../../../../../libs/date"
import { convert_bytes_to_optimal_unit } from "../../../../../libs/functions"
import Tooltip from "../../../../../views/theme/default/desktop/tooltip"
import Snackbar from "../../../../../views/theme/default/desktop/snackbar"
import AppComponent from "../../../../../views/app"

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

// mobxの状態をaction内でのみ変更可能にする
configure({ "enforceActions": true })

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
                    const data = res.data
                    if (data.success == false) {
                        alert(data.error)
                    } else {
                        Snackbar.show("削除しました", false)
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
                    alert(error)
                })
                .then(_ => {

                })
        }
    }
    render() {
        const { platform, logged_in_user, aggregation_result } = this.props
        const { media } = this.state
        const bytes_unit_str = convert_bytes_to_optimal_unit(aggregation_result.total_bytes)
        return (
            <div id="app" className="settings">
                <Head title={`アップロード / 設定 / ${config.site.name}`} platform={platform} logged_in_user={logged_in_user} />
                <NavigationbarView logged_in_user={logged_in_user} is_bottom_hidden={true} />
                <div className="settings-container tooltip-offset-base emoji-picker-offset-base">
                    <div className="inside">
                        <SettingsMenuView active="uploads" />
                        <div className="settings-container-main">

                            <div className="settings-component form uploads-aggregation meiryo">
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
                                <div className="settings-component form uploads meiryo">
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
                                                    <TooltipButton handle_click={event => this.destroy(media_id)} />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                : null}

                        </div>
                    </div>
                </div>
                <Tooltip />
            </div>
        )
    }
}