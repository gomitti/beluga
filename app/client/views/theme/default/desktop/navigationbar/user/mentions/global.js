import { Component } from "react"
import { observer } from "mobx-react"
import { request } from "../../../../../../../api"
import Store from "../../../../../../../stores/theme/default/desktop/navigationbar/mentions"
import StatusView from "../../../status"

@observer
export default class View extends Component {
    constructor(props) {
        super(props)
        const { logged_in } = props
        this.store = new Store(logged_in.id, {})
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
                        return <StatusView status={status} key={status.id} options={{ "show_belonging": true }} handle_click_channel={this.onClickHashtag} handle_click_mention={this.onClickMention} />
                    })}
                </div>
            </div>
        )
    }
}