import { Component } from "react"
import classnames from "classnames"

export default class HeaderComponent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            "is_menu_hidden": true
        }
    }
    toggleMenu = () => {
        this.setState({
            "is_menu_hidden": !this.state.is_menu_hidden
        })
    }
    render() {
        const { community, channel } = this.props
        return (
            <div className="timeline-header-component">
                <div className="inside">
                    <div className="label-area channel">
                        <span className="icon channel"></span>
                        <span className="label">{channel.name}</span>
                        <span className="divider"></span>
                        <div className="community-avatar-area">
                            <a className="link" href={`/${community.name}`}>
                                <img className="image" src={community.avatar_url} />
                            </a>
                        </div>
                        <a className="community-name" href={`/${community.name}`}>{community.display_name}</a>
                    </div>
                    <div className="dropdown-menu">
                        <span className="icon" onClick={this.toggleMenu}></span>
                        <div className={classnames("dropdown-component", { "active": !this.state.is_menu_hidden })}>
                            <div className="inside">
                                <ul className="menu">
                                    <a className="item user-defined-bg-color-hover">詳細を表示</a>
                                    <a className="item user-defined-bg-color-hover" href={`/${community.name}/${channel.name}/settings/profile`}>チャンネル設定</a>
                                    <span className="divider"></span>
                                    <a className="item user-defined-bg-color-hover">{`#${channel.name} から退出する`}</a>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}