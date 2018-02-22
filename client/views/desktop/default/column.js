import { Component } from "react"
import { observable, action } from "mobx"
import { observer } from "mobx-react"
import assert, { is_object, is_array, is_string, is_function } from "../../../assert"
import { ColumnStore, options as column_options } from "../../../stores/column"
import StatusView from "./status"
import PostboxView from "./postbox"
import TimelineView from "./timeline"
import HomeTimelineHeaderView from "./timeline/header/home"
import HashtagTimelineHeaderView from "./timeline/header/hashtag"
import ServerTimelineHeaderView from "./timeline/header/server"
import settings, { enum_column_target, enum_column_type } from "../../../settings/desktop"
import { request } from "../../../api"

@observer
export class ColumnContainer extends Component {
	@observable.shallow columns = []
	@action.bound
	open(request_query, params, options, initial_statuses, target, source_column) {
		assert(is_object(request_query), "@request_query must be object")
		assert(is_object(params), "@params must be object")
		assert(is_object(options), "@options must be object")
		assert(is_array(initial_statuses) || initial_statuses === null, "@initial_statuses must be array or null")
		target = target || settings.column.target
		if (target === enum_column_target.new) {
			for (const column of this.columns) {	// 一度開いたカラムに上書き
				if (column.target === enum_column_target.new) {
					column.push(request_query, params, options, initial_statuses)
					return
				}
			}
		}
		if(target === enum_column_target.self){
			source_column.push(request_query, params, options, initial_statuses)
			return
		}
		
		// 新しいカラムを作る
		const column = new ColumnStore(target)
		column.push(request_query, params, options, initial_statuses)
		
		if (this.columns.length === 0){
			this.columns.push(column)
			return
		}
		if(!source_column){
			this.columns.push(column)
			return
		}

		// 新しいカラムはそれが開かれたカラムの右隣に追加する
		assert(source_column instanceof ColumnStore, "@source_column must be an instance of ColumnStore")
		let insert_index = 0
		for(const column of this.columns){
			if(column.identifier === source_column.identifier){
				break
			}
			insert_index += 1
		}
		this.columns.splice(insert_index + 1, 0, column)
		return column
	}
	@action.bound
	close = identifier => {
		for (let i = 0; i < this.columns.length; i++) {
			const column = this.columns[i]
			if (column.identifier === identifier) {
				this.columns.splice(i, 1)
				return
			}
		}
	}
	onClickHashtag = (event, source_column) => {
		event.preventDefault()
		const { server } = this.props
		assert(is_object(server), "@server must be object")
		const tagname = event.target.getAttribute("data-tagname")
		assert(is_string(tagname), "@tagname must be string")
		for (const column of this.columns) {
			if (column.params.hashtag && column.params.hashtag.tagname === tagname) {
				alert("すでに開いています")
				return
			}
		}
		request
			.post("/hashtag/show", { tagname, "server_id": server.id })
			.then(res => {
				const data = res.data
				const { hashtag, success } = data
				if (success == false) {
					alert(data.error)
					return
				}
				if(!hashtag){
					location.href = `/hashtag/${server.name}/create`
					return
				}
				this.open({ "id": hashtag.id },
					{ hashtag },
					Object.assign({}, column_options, {
						"type": enum_column_type.hashtag,
					}),
					null,
					settings.column.target,
					source_column)
			})
			.catch(error => {
				alert(error)
			})
	}
	onClickMention = (event, source_column) => {
		event.preventDefault()
		const { server } = this.props
		assert(is_object(server), "@server must be object")
		const name = event.target.getAttribute("data-name")
		assert(is_string(name), "@name must be string")
		for (const column of this.columns) {
			if (column.params.recipient && column.params.recipient.name === name) {
				alert("すでに開いています")
				return
			}
		}
		request
			.post("/user/show", { name })
			.then(res => {
				const data = res.data
				const { user, success } = data
				if (success == false) {
					alert(data.error)
					return
				}
				if(!user){
					alert("ユーザーが見つかりません")
					return
				}
				this.open({ "user_id": user.id, "server_id": server.id },
					{ "recipient": user, server },
					Object.assign({}, column_options, { "type": enum_column_type.home }),
					null,
					settings.column.target,
					source_column)
			})
			.catch(error => {
				alert(error)
			})
	}
}

@observer
export class ColumnView extends Component {
	onClose = event => {
		event.preventDefault()
		const { close, column } = this.props
		assert(is_object(column), "@column must be object")
		assert(is_function(close), "@close must be function")
		close(column.identifier)
	}
	onBack = () => {
		event.preventDefault()
		const { column } = this.props
		assert(is_object(column), "@column must be object")
		column.pop()
	}
	onClickHashtag = event => {
		const { column, onClickHashtag } = this.props
		onClickHashtag(event, column)
	}
	onClickMention = event => {
		const { column, onClickMention } = this.props
		onClickMention(event, column)
	}
	render() {
		const { column, logged_in, onClickHashtag, onClickMention, media_favorites, media_history } = this.props
		let headerView = null
		if (column.options.type === enum_column_type.home) {
			const { recipient } = column.params
			headerView = <HomeTimelineHeaderView column={column} recipient={recipient} onClose={this.onClose} onBack={this.onBack} />
		} else if (column.options.type === enum_column_type.hashtag) {
			const { hashtag } = column.params
			headerView = <HashtagTimelineHeaderView column={column} hashtag={hashtag} onClose={this.onClose} onBack={this.onBack} />
		} else if (column.options.type === enum_column_type.server) {
			const { server } = column.params
			headerView = <ServerTimelineHeaderView column={column} server={server} onClose={this.onClose} onBack={this.onBack} />
		}
		return (
			<div className="column timeline">
				<div className="inside timeline-container round">
					{headerView}
					<div className="content">
						<div className="vertical"></div>
						{column.options.postbox.is_hidden ? null : <PostboxView logged_in={logged_in} {...column.params} media_favorites={media_favorites} media_history={media_history} />}
						<TimelineView timeline={column.timeline} options={column.options} onClickHashtag={this.onClickHashtag} onClickMention={this.onClickMention} />
					</div>
				</div>
			</div>
		)
	}
}