import React, { Component } from "react"
import { observer } from "mobx-react"
import config from "../../../../../beluga.config"
import Tooltip from "../tooltip"
import { get_image_url_by_shortname_or_null } from "../../../../../stores/theme/default/common/emoji";
import { is_array } from "../../../../../assert";

const TooltipContentComponent = ({ user_names, shortname }) => {
    const listViews = []
    if (is_array(user_names) === false) {
        return null
    }
    user_names.forEach(name => {
        listViews.push(<span className="name">{`@${name}`}</span>)
        listViews.push(<span className="comma">,</span>)
    })
    if (listViews.length > 0) {
        listViews.pop()
    }
    return (
        <div className="tooltip-content-reactions">
            <div className="name-list">{listViews}</div>
            <div className="shortname">{`:${shortname}:`}</div>
        </div>
    )
}

class Button extends Component {
    componentWillUnmount() {
        Tooltip.hide()
    }
    render() {
        const { user_names, shortname, image_url, count, handle_click } = this.props
        const content = <TooltipContentComponent user_names={user_names} shortname={shortname} />
        return (
            <button
                className="status-reaction"
                key={shortname}
                ref={dom => this.dom = dom}
                onClick={event => handle_click(shortname)}
                onMouseEnter={() => Tooltip.show(this.dom, content)}
                onMouseOver={() => Tooltip.show(this.dom, content)}
                onMouseOut={() => Tooltip.hide()}>
                <span className="emoji emoji-sizer" style={{ "backgroundImage": `url(${image_url})` }}></span>
                <span className="count">{count}</span>
            </button>
        )
    }
}

@observer
export default class ReactionsComponent extends Component {
    toggle = (shortname) => {
        const { status } = this.props
        status.reactions.toggle(shortname)
    }
    render() {
        const { status, community } = this.props
        if (status.reactions.count == 0) {
            return null
        }
        const community_id = community ? community.id : null
        const buttons = []
        status.reactions.list.forEach(item => {
            const { shortname, count, user_names } = item
            const image_url = get_image_url_by_shortname_or_null(shortname, community_id)
            const content = <TooltipContentComponent user_names={user_names} shortname={shortname} />
            buttons.push(
                <Button handle_click={this.toggle} shortname={shortname} image_url={image_url} user_names={user_names} count={count} />
            )
        })
        return (
            <div className="status-reactions detail-row">
                {buttons}
            </div>
        )
    }
}