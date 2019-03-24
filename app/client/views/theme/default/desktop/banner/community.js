import classnames from "classnames"

export default ({ title, community }) => {
    return (
        <div className="community-banner-compoent">
            <div className="inside">
                <div className="title">{title}</div>
                <div className="divider"></div>
                <img src={community.avatar_url} className="avatar" />
                <a href={`/${community.name}`} className="name">{community.display_name}</a>
            </div>
        </div>
    )
}