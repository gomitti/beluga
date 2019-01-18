import { Component } from "react"
import { observer } from "../../../../../../../stores/theme/default/common/mobx"
import { request } from "../../../../../../../api"
import Store from "../../../../../../../stores/theme/default/desktop/navigationbar/mentions"
import StatusView from "../../../status"

@observer
export default class View extends Component {
    constructor(props) {
        super(props)
        const { logged_in_user } = props
        this.store = new Store(logged_in_user.id, {})
    }
    componentDidMount() {
        this.store.update()
    }
    onClickHashtag = event => {

    }
    onClickMention = event => {

    }
    render() {
        return (
            <div className="timeline global scroller">
                <div className="inside">
                    {this.store.statuses.map(status => {
                        return <StatusView status={status} key={status.id} options={{ "show_source_link": true }} handle_click_channel={this.onClickHashtag} handle_click_mention={this.onClickMention} />
                    })}
                </div>
            </div>
        )
    }
}