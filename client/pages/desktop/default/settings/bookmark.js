import { Component } from "react"
import { useStrict } from "mobx"
import ReactCrop, { makeAspectCrop } from "react-image-crop"
import classnames from "classnames"
import Head from "../../../../views/desktop/default/head"
import NavigationBarView from "../../../../views/desktop/default/navigationbar"
import SettingsMenuView from "../../../../views/desktop/default/settings/menu"
import config from "../../../../beluga.config"
import { request } from "../../../../api"

// mobxの状態をaction内でのみ変更可能にする
useStrict(true)

export default class App extends Component {
	static async getInitialProps({ query }) {
		return { ...query }
	}
	constructor(props) {
		super(props)
		const { media } = props
		this.state = {
			"selected_media": [],
		}
		this.selected_media_ids = []
		if (media) {
			for (const item of media.bookmark) {
				this.selected_media_ids.push(item.id)
				this.state.selected_media.push(item)
			}
		}
		if (request) {
			request.csrf_token = this.props.csrf_token
		}
		if (typeof history !== "undefined") {
			history.scrollRestoration = "manual"
		}
	}
	onSelectImage = (event, item) => {
		event.preventDefault()
		const selected_media = this.state.selected_media
		const index = this.selected_media_ids.indexOf(item.id)
		if (index === -1) {
			selected_media.push(item)
			this.selected_media_ids.push(item.id)
			this.setState({
				selected_media
			})
		} else {
			selected_media.splice(index, 1)
			this.selected_media_ids.splice(index, 1)
			this.setState({
				selected_media
			})
		}
	}
	onUpdateImage = event => {
		if (this.pending === true) {
			return
		}
		this.pending = true
		request
			.post("/account/bookmark/media/update", {
				"media": this.selected_media_ids
			})
			.then(res => {
				const data = res.data
				if (data.success == false) {
					alert(data.error)
				} else {
					alert("保存しました")
				}
			})
			.catch(error => {
				alert(error)
			})
			.then(_ => {
				this.pending = false
			})
	}
	render() {
		const { profile_image_size, platform, logged_in, media } = this.props
		if (!(media.bookmark instanceof Array)) {
			return null
		}
		if (!(media.history instanceof Array)) {
			return null
		}
		const { preview_src } = this.state
		if (!logged_in.profile) {
			return null
		}
		const selectedImageViews = []
		for (const item of this.state.selected_media) {
			const ext = item.is_image ? item.extension : "jpg"
			const square_src = `${item.uri}/${item.directory}/${item.suffix}.square.${ext}`
			selectedImageViews.push(<a className="item" href={item.source} target="_blank"><img className="image" src={square_src} /></a>)
		}
		const imageCandidateViews = []
		for (const item of media.history) {
			const index = this.selected_media_ids.indexOf(item.id)
			const active = index !== -1
			const ext = item.is_image ? item.extension : "jpg"
			const square_src = `${item.uri}/${item.directory}/${item.suffix}.square.${ext}`
			imageCandidateViews.push(
				<a className={classnames("item", { active })} href={item.source} onClick={event => this.onSelectImage(event, item)}>
					<img className="image" src={square_src} />
					<div className="overlay-bg"></div>
					<div className={classnames("overlay-fg user-defined-border-color-hover user-defined-border-color-active", { active })}></div>
					{(() => {
						if (index >= 0) {
							return <span className="number user-defined-bg-color verdana">{index + 1}</span>
						}
					})()}
				</a>
			)
		}
		return (
			<div id="app" className="settings">
				<Head title={`プロフィール / 設定 / ${config.site.name}`} platform={platform} logged_in={logged_in} />
				<NavigationBarView logged_in={logged_in} />
				<SettingsMenuView />
				<div className="settings-content scroller-wrapper">
					<div className="scroller">
						<div className="inside">

							<div className="settings-module bookmark meiryo">
								<div className="head">
									<h1>画像</h1>
								</div>

								<div className="description">
									投稿欄の画像一覧に表示したい画像を選択してください。
								</div>

								<div className="image-selector scroller-wrapper">
									<div className="list bookmarks scroller">
										{selectedImageViews}
									</div>
									<div className="list candidates scroller">
										{imageCandidateViews}
									</div>
								</div>

								<div className="submit">
									<button className="button user-defined-bg-color" onClick={this.onUpdateImage}>画像を保存</button>
								</div>
							</div>

							<div className="settings-module bookmark meiryo">
								<div className="head">
									<h1>絵文字</h1>
								</div>

								<div className="description">
									絵文字一覧に表示したい絵文字を選択してください。
								</div>

								<div className="submit">
									<button className="button user-defined-bg-color">絵文字を保存</button>
								</div>
							</div>

						</div>
					</div>
				</div>
			</div>
		)
	}
}