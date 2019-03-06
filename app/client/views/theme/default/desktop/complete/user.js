import { Component } from "react"
import classnames from "classnames"
import assert, { is_object } from "../../../../../assert";

const event_types = {
    "show": "__event_members_complete_show",
    "hide": "__event_members_complete_hide",
}

const dispatch_event = (eventName, opts) => {
    if (typeof window === "undefined") {
        return
    }
    let event
    if (typeof window.CustomEvent === "function") {
        event = new window.CustomEvent(eventName, { "detail": opts })
    } else {
        event = document.createEvent("Event")
        event.initEvent(eventName, false, true)
        event.detail = opts
    }
    window.dispatchEvent(event)
}

const register_methods = target => {
    target.show = (kwargs, position, callback_select) => {
        target.callback_select = callback_select
        dispatch_event(event_types.show, { kwargs, position })
    }
    target.search = name => {

    }
    target.hide = () => {
        dispatch_event(event_types.hide, {})
    }
}

const map_community_members = {}

@register_methods
class MemberComplete extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_hidden": true,
            "filtered_members": [],
            "position": {
                "top": 0,
                "left": 0,
                "width": 0,
                "height": 0,
            }
        }
        if (typeof window !== "undefined") {
            window.removeEventListener(event_types.show, this.show)
            window.addEventListener(event_types.show, this.show, false)
            window.removeEventListener(event_types.hide, this.hide)
            window.addEventListener(event_types.hide, this.hide, false)
        }
    }
    show = payload => {
        const { detail } = payload
        const { kwargs, position } = detail
        const { community_id, users } = kwargs
        if (users) {

        }
        this.community_id = community_id
        const members = map_community_members[community_id]
        if (members) {
            this.members = members
            this.setState({
                "filtered_members": members,
                "is_hidden": false,
                position
            })
            return
        }
        this.setState({
            "is_hidden": false, position
        })
        request
            .get("/community/members", { "id": community_id })
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    return
                }
                if (this.community_id !== community_id) {
                    return
                }
                const { members } = data
                this.members = members
                this.setState({
                    "filtered_members": members,
                })
            })
    }
    hide = () => {
        if (this.state.is_hidden) {
            return
        }
        this.setState({
            "is_hidden": true
        })
    }
    render() {
        const { position } = this.state
        return (
            <div id="member_complete" className={classnames({
                "show": !this.state.is_hidden,
                "hide": this.state.is_hidden,
            })} style={position}>
                <ul className="list">
                    <li className="user">
                        <a className="avatar" href={`/user/${user.name}`}>
                            <img className="image" src={user.avatar_url} />
                        </a>
                        <a className="name" href={`/user/${user.name}`}>
                            {user.name}
                        </a>
                        <a className="display-name" href={`/user/${user.name}`}>
                            {user.display_name}
                        </a>
                    </li>
                </ul>
            </div >
        )
    }
}

export default MemberComplete