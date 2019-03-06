import classnames from "classnames"

export default ({ active_page, community }) => {
    return (
        <div className="settings-menu-component">
            <div className="inside">
                <h2 className="title">設定</h2>
                <ul className="menu">
                    <a className="item" href={`/${community.name}/settings/profile`}>
                        <span className={classnames("user-defined-color-hover user-defined-color-active label user-defined-border-color-active", { "active": active_page === "profile" })}>プロフィール</span>
                    </a>
                    <a className="item" href={`/${community.name}/settings/role`}>
                        <span className={classnames("user-defined-color-hover user-defined-color-active label user-defined-border-color-active", { "active": active_page === "role" })}>役職</span>
                    </a>
                </ul>
            </div>
        </div>
    )
}