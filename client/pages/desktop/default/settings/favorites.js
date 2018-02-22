import { Component } from "react"
import { observable, action } from "mobx"
import { observer } from "mobx-react"
import ReactCrop, { makeAspectCrop } from "react-image-crop"
import classnames from "classnames"
import Head from "../../../../views/desktop/default/head"
import NavigationBarView from "../../../../views/desktop/default/navigationbar"
import SettingsMenuView from "../../../../views/desktop/default/settings/menu"
import { EmojiPickerView, map_shortname_fname, map_fname_category } from "../../../../views/desktop/default/emoji"
import config from "../../../../beluga.config"
import { request } from "../../../../api"

@observer
class MediaComponent extends Component {
	@observable.shallow selected_media = []
	constructor(props) {
		super(props)
		const { favorites } = props
		this.selected_media_ids = []
		if (!(favorites instanceof Array)){
			return
		}
		for (const item of favorites) {
			this.selected_media_ids.push(item.id)
			this.selected_media.push(item)
		}
	}
	onSelectImage = (event, item) => {
		event.preventDefault()
		const index = this.selected_media_ids.indexOf(item.id)
		if (index === -1) {
			this.selected_media.push(item)
			this.selected_media_ids.push(item.id)
		} else {
			this.selected_media.splice(index, 1)
			this.selected_media_ids.splice(index, 1)
		}
	}
	onUpdateImage = event => {
		if (this.pending === true) {
			return
		}
		this.pending = true
		request
			.post("/account/favorite/media/update", {
				"media_ids": this.selected_media_ids
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
		const { favorites, history } = this.props
		if (!(favorites instanceof Array)) {
			return null
		}
		if (!(history instanceof Array)) {
			return null
		}
		const selectedImageViews = []
		for (const item of this.selected_media) {
			const ext = item.is_image ? item.extension : "jpg"
			const square_src = `${item.uri}/${item.directory}/${item.suffix}.square.${ext}`
			selectedImageViews.push(<a className="item" href={item.source} target="_blank"><img className="image" src={square_src} /></a>)
		}
		const imageCandidateViews = []
		for (const item of history) {
			const index = this.selected_media_ids.indexOf(item.id)
			const active = index !== -1
			const ext = item.is_image ? item.extension : "jpg"
			const square_src = `${item.uri}/${item.directory}/${item.suffix}.square.${ext}`
			imageCandidateViews.push(
				<a className={classnames("item", { active })} href={item.source} onClick={event => this.onSelectImage(event, item)}>
					<img className="image" src={square_src} />
					<div className="overlay-bg"></div>
					<div className={classnames("overlay-fg user-defined-border-color-active", { active })}></div>
					{(() => {
						if (index >= 0) {
							return <span className="number user-defined-bg-color verdana">{index + 1}</span>
						}
					})()}
				</a>
			)
		}
		return (
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
		)
	}
}

@observer
class EmojiComponent extends Component {
	@observable.shallow selected_emojis = []
	selected_shortnames = []
	componentDidMount() {
		const { favorites } = this.props
		if (favorites) {
			for (const shortname of favorites) {
				const fname = map_shortname_fname[shortname]
				const category = map_fname_category[fname]
				this.selected_emojis.push({ shortname, category, fname })
				this.selected_shortnames.push(shortname)
			}
		}
	}
	pick = (shortname, category, fname) => {
		const emoji = { shortname, category, fname }
		const index = this.selected_shortnames.indexOf(shortname)
		if (index === -1) {
			this.selected_emojis.push({ shortname, category, fname })
			this.selected_shortnames.push(shortname)
		} else {
			this.selected_emojis.splice(index, 1)
			this.selected_shortnames.splice(index, 1)
		}
	}
	onUpdateEmoji = event => {
		if (this.pending === true) {
			return
		}
		this.pending = true
		request
			.post("/account/favorite/emoji/update", {
				"shortnames": this.selected_shortnames
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
		const selectedEmojiView = []
		for (const emoji of this.selected_emojis) {
			const { shortname, category, fname } = emoji
			selectedEmojiView.push(<button onClick={event => this.pick(shortname, category, fname)} ><i className={`emojipicker-ignore-click emoji-${category} _${fname}`}></i></button>)
		}
		return (
			<div className="settings-module bookmark meiryo">
				<div className="head">
					<h1>絵文字</h1>
				</div>

				<div className="description">
					絵文字一覧に表示したい絵文字を選択してください。
									</div>

				<div className="emoji-selector scroller-wrapper">
					<div className="list bookmarks scroller">
						{selectedEmojiView}
					</div>
					<div className="list candidates">
						<EmojiPickerView pick={this.pick} />
					</div>
				</div>

				<div className="submit">
					<button className="button user-defined-bg-color" onClick={this.onUpdateEmoji}>絵文字を保存</button>
				</div>
			</div>
		)
	}
}

export default class App extends Component {
	static async getInitialProps({ query }) {
		return { ...query }
	}
	constructor(props) {
		super(props)
		if (request) {
			request.csrf_token = this.props.csrf_token
		}
		if (typeof history !== "undefined") {
			history.scrollRestoration = "manual"
		}
	}
	render() {
		const { platform, logged_in, media_favorites, media_history, emoji_favorites } = this.props
		if (!(media_favorites instanceof Array)) {
			return null
		}
		if (!(media_history instanceof Array)) {
			return null
		}
		if (!(emoji_favorites instanceof Array)) {
			return null
		}
		return (
			<div id="app" className="settings">
				<Head title={`プロフィール / 設定 / ${config.site.name}`} platform={platform} logged_in={logged_in} />
				<NavigationBarView logged_in={logged_in} />
				<SettingsMenuView active="favorites" />
				<div className="settings-content scroller-wrapper">
					<div className="scroller">
						<div className="inside">
							<MediaComponent favorites={media_favorites} history={media_history} />
							<EmojiComponent favorites={emoji_favorites} />
						</div>
					</div>
				</div>
			</div>
		)
	}
}