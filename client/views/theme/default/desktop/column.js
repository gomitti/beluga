import { Component } from "react"
import { observable, action } from "mobx"
import { observer } from "mobx-react"
import enums from "../../../../enums"
import assign from "../../../../libs/assign"
import assert, { is_object, is_array, is_string, is_function } from "../../../../assert"
import { ColumnStore, default_options as column_options, default_settings as column_settings } from "../../../../stores/theme/default/desktop/column"
import StatusView from "./status"
import PostboxView from "./postbox"
import TimelineView from "./timeline"
import HomeTimelineHeaderView from "./timeline/header/home"
import HashtagTimelineHeaderView from "./timeline/header/hashtag"
import ServerTimelineHeaderView from "./timeline/header/server"
import settings from "../../../../settings/desktop"
import { request } from "../../../../api"
import UploadManager from "../../../../stores/theme/default/common/uploader"

@observer
export class ColumnContainer extends Component {
    @observable.shallow columns = []
    componentDidMount() {
        this.restore()
    }
    equals = (a, b) => {
        assert(is_object(a), "@a must be of type object")
        assert(is_object(b), "@b must be of type object")
        if (a.options.type !== b.options.type) {
            return false
        }
        if (a.params.hashtag && b.params.hashtag) {
            if (a.params.hashtag.tagname === b.params.hashtag.tagname) {
                return true
            }
        }
        if (a.params.recipient && b.params.recipient) {
            if (a.params.recipient.id === b.params.recipient.id) {
                return true
            }
        }
        if (a.params.server && b.params.server) {
            if (a.params.server.id === b.params.server.id) {
                return true
            }
        }
        return false
    }
    serialize = () => {
        const pickles = []
        for (const column of this.columns) {
            const { history, target, settings } = column
            pickles.push({ history, target, settings })
        }
        const pickles_json = JSON.stringify(pickles)
        const pathname = location.pathname
        localStorage.setItem(`columns.serialization.${pathname}`, pickles_json)
    }
    restore = () => {
        const pathname = location.pathname
        const pickles_json = localStorage.getItem(`columns.serialization.${pathname}`)
        if (!pickles_json) {
            return false
        }
        try {
            const pickles = JSON.parse(pickles_json)
            assert(is_array(pickles), "@pickles must be of type array")
            assert(pickles.length >= this.columns.length, "the number of restored columns is wrong")

            // デフォルトで開かれているカラムを追跡する必要がある
            let column_index = 0
            for (let pickle_index = 0; pickle_index < pickles.length; pickle_index++) {
                const { history, target, settings } = pickles[pickle_index]
                assert(is_string(target), "@target must be of type string")
                assert(is_object(settings), "@settings must be of type object")
                assert(history.length > 0, "length of @history must be greater than 0")
                const item = history[0]
                const { request_query, params, options } = item
                if (column_index < this.columns.length) {
                    const column = this.columns[column_index]
                    if (this.equals(item, column)) {
                        column.restore(history, assign(column_settings, settings))
                        column_index += 1
                        continue
                    }
                }
                assert(pickle_index > 0, "@pickle_index must be greater than 0")	// 通常あり得ない
                const column = this.insert(
                    request_query,
                    params,
                    options,
                    null,
                    target,
                    pickle_index
                )
                column.restore(history, assign(column_settings, settings))
                column_index += 1
            }
            return true
        } catch (error) {
            console.log(error)
            console.log(error.stack)
            this.serialize()
        }
        return false
    }
    // 初期カラムを追加
    // @insert_position	この位置の左隣に追加する
    @action.bound
    insert(request_query, params, options, initial_statuses, target, insert_position) {
        assert(is_object(request_query), "@request_query must be of type object")
        assert(is_object(params), "@params must be of type object")
        assert(is_object(options), "@options must be of type object")
        assert(is_array(initial_statuses) || initial_statuses === null, "@initial_statuses must be of type array or null")
        target = target || settings.column.target
        const column = new ColumnStore(target)
        column.push(request_query, params, options, initial_statuses)
        if (typeof insert_position === "number") {
            assert(insert_position >= 1, "@insert_position must be greater than or equal to 1")
            this.columns.splice(insert_position, 0, column)
        } else {
            this.columns.push(column)
        }
        return column
    }
    // ユーザー操作で追加
    @action.bound
    open = (request_query, params, options, initial_statuses, target, source_column) => {
        const column = (() => {
            assert(is_object(request_query), "@request_query must be of type object")
            assert(is_object(params), "@params must be of type object")
            assert(is_object(options), "@options must be of type object")
            assert(is_array(initial_statuses) || initial_statuses === null, "@initial_statuses must be of type array or null")
            target = target || settings.column.target

            if (target === enums.column.target.new) {
                for (const column of this.columns) {	// 一度開いたカラムに上書き
                    if (column.target === enums.column.target.new) {
                        column.push(request_query, params, options, initial_statuses)
                        return column
                    }
                }
            }

            if (target === enums.column.target.self) {
                if (source_column instanceof ColumnStore) {
                    source_column.push(request_query, params, options, initial_statuses)
                    return source_column
                }
                for (const column of this.columns) {	// 一度開いたカラムに上書き
                    if (column.target === enums.column.target.self) {
                        column.push(request_query, params, options, initial_statuses)
                        return column
                    }
                }
            }

            // 新しいカラムを作る
            const column = new ColumnStore(target)
            column.push(request_query, params, options, initial_statuses)

            if (this.columns.length === 0) {
                this.columns.push(column)
                return column
            }
            if (!source_column) {
                this.columns.push(column)
                return column
            }

            // 新しいカラムはそれが開かれたカラムの右隣に追加する
            assert(source_column instanceof ColumnStore, "@source_column must be an instance of ColumnStore")
            let insert_index = 0
            for (const column of this.columns) {
                if (column.identifier === source_column.identifier) {
                    break
                }
                insert_index += 1
            }
            this.columns.splice(insert_index + 1, 0, column)
            return column
        })()
        this.serialize()
        return column
    }
    @action.bound
    close = identifier => {
        const is_closed = (() => {
            for (let i = 0; i < this.columns.length; i++) {
                const column = this.columns[i]
                if (column.identifier === identifier) {
                    if (column.options.is_closable) {
                        this.columns.splice(i, 1)
                        return true
                    } else {
                        alert("このカラムは閉じることができません")
                        return false
                    }
                }
            }
            return false
        })()
        if (is_closed) {
            this.serialize()
        }
    }
    onClickHashtag = (event, source_column) => {
        event.preventDefault()
        const { server } = this.props
        assert(is_object(server), "@server must be of type object")
        const tagname = event.target.getAttribute("data-tagname")
        assert(is_string(tagname), "@tagname must be of type string")
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
                if (!hashtag) {
                    alert("ルームが見つかりません")
                    return
                }
                this.open({ "id": hashtag.id },
                    { hashtag },
                    Object.assign({}, column_options, {
                        "type": enums.column.type.hashtag,
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
        assert(is_object(server), "@server must be of type object")
        const name = event.target.getAttribute("data-name")
        assert(is_string(name), "@name must be of type string")
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
                if (!user) {
                    alert("ユーザーが見つかりません")
                    return
                }
                this.open({ "user_id": user.id, "server_id": server.id },
                    { "recipient": user, server },
                    Object.assign({}, column_options, { "type": enums.column.type.home }),
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
        const { close, column, serialize } = this.props
        assert(is_object(column), "@column must be of type object")
        assert(is_function(close), "@close must be function")
        assert(is_function(serialize), "@serialize must be function")
        close(column.identifier)
    }
    onBack = () => {
        event.preventDefault()
        const { column } = this.props
        assert(is_object(column), "@column must be of type object")
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
    loadMoreStatuses = () => {
        const { column } = this.props
        const { timeline } = column
        timeline.more()
    }
    render() {
        const { column, logged_in, onClickHashtag, onClickMention, media_favorites, media_history, serialize, request_query } = this.props
        let headerView = null
        if (column.options.type === enums.column.type.home) {
            const { recipient } = column.params
            headerView = <HomeTimelineHeaderView column={column} serialize={serialize} recipient={recipient} onClose={this.onClose} onBack={this.onBack} />
        } else if (column.options.type === enums.column.type.hashtag) {
            const { hashtag } = column.params
            headerView = <HashtagTimelineHeaderView column={column} serialize={serialize} hashtag={hashtag} onClose={this.onClose} onBack={this.onBack} />
        } else if (column.options.type === enums.column.type.server) {
            const { server } = column.params
            headerView = <ServerTimelineHeaderView column={column} serialize={serialize} server={server} onClose={this.onClose} onBack={this.onBack} />
        }
        const uploader = new UploadManager()
        return (
            <div className="column timeline">
                <div className="inside timeline-container round">
                    {headerView}
                    <div className="content">
                        <div className="vertical"></div>
                        {column.options.postbox.is_hidden ? null : <PostboxView logged_in={logged_in} uploader={uploader} {...column.params} media_favorites={media_favorites} media_history={media_history} />}
                        <TimelineView
                            logged_in={logged_in}
                            timeline={column.timeline}
                            request_query={request_query}
                            options={column.options}
                            load_more_statuses={this.loadMoreStatuses}
                            onClickHashtag={this.onClickHashtag}
                            onClickMention={this.onClickMention} />
                    </div>
                </div>
            </div>
        )
    }
}