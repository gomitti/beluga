import classnames from "classnames"

export default ({ community }) => {
    return (
        <div className="community-banner-compoent">
            <div className="inside">
                <img src={community.avatar_url} className="avatar" />
                <a href={`/${community.name}`} className="name">{community.display_name}</a>
            </div>
        </div>
    )
}