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
        const { community } = this.props
        return (
            <div className="column-community-header-component rounded-corner">
                <div className="inside">
                    <div className="header">
                        <div className="avatar">
                            <a href={`/${community.name}`}>
                                <img className="image" src={community.avatar_url} />
                            </a>
                        </div>
                        <div className="name">
                            <a href={`/${community.name}`}>{community.display_name}</a>
                        </div>
                        <div className="dropdown-menu">
                            <span className="icon" onClick={this.toggleMenu}></span>
                            <div className={classnames("dropdown-component", { "active": !this.state.is_menu_hidden })}>
                                <div className="inside">
                                    <ul className="menu">
                                        <a className="item user-defined-bg-color-hover" href={`/${community.name}/statuses`}>パブリックタイムライン</a>
                                        <a className="item user-defined-bg-color-hover" href={`/${community.name}/channels`}>チャンネル一覧</a>
                                        <span className="divider"></span>
                                        <a className="item user-defined-bg-color-hover" href={`/${community.name}/settings/profile`}>コミュニティ設定</a>
                                        <span className="divider"></span>
                                        <a className="item user-defined-bg-color-hover">{`${community.display_name} から退出する`}</a>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}