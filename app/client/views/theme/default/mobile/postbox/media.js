import { Component } from "react"

const get_thumbnail_url_of_item = item => {
    if (item.is_image) {
        return `${item.uri}/${item.directory}/${item.prefix}.square.${item.extension}`
    }
    if (item.is_video) {
        return `${item.uri}/${item.directory}/${item.prefix}.square.jpg`
    }
    return null
}

const get_original_url_of_item = item => {
    return `${item.uri}/${item.directory}/${item.prefix}.${item.extension}`
}

export default class MediaView extends Component {
    render() {
        const { media, is_hidden, append, title } = this.props
        if (is_hidden) {
            return null
        }
        const mediaViews = []
        if (Array.isArray(media)) {
            const num_per_row = 4
            const rows = []
            const num_rows = Math.ceil(media.length / num_per_row)
            for (let y = 0; y < num_rows; y++) {
                rows.push(media.slice(y * num_per_row, Math.min((y + 1) * num_per_row, media.length)))
            }
            rows.forEach(row => {
                const views = []
                row.forEach(item => {
                    const thumbnail_url = get_thumbnail_url_of_item(item)
                    if (!thumbnail_url) {
                        return
                    }
                    const original_url = get_original_url_of_item(item)
                    const sizes = item.prefix.split("-")
                    views.push(
                        <a href={original_url} className="item" onClick={event => append(event, item)}>
                            <img className="thumbnail" src={thumbnail_url} />
                        </a>
                    )
                })
                mediaViews.push(
                    <div className="row">{views}</div>
                )
            })
        }
        if (mediaViews.length == 0) {
            return (
                <div className="postbox-media-component history no-media">
                    <a href="/settings/pins" className="user-defined-color bold">画像を登録</a>するとここに表示されます
				</div>
            )
        }
        return (
            <div className="postbox-media-component history scroller-container" ref="wrapper">
                <p className="title">{title}</p>
                <div className="scroller">
                    {mediaViews}
                </div>
            </div>
        )
    }
}