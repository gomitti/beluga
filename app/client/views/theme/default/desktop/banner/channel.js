import classnames from "classnames"

export default ({ community, channel }) => {
    return (
        <div className="channel-banner-compoent">
            <div className="inside">
                <div className="title-area">
                    設定
                </div>
                <div className="divider"></div>
                <div className="channel-area">
                    <span className="icon"></span>
                    <a href={`/${community.name}/${channel.name}`} className="name">{channel.name}</a>
                </div>
                <div className="divider"></div>
                <div className="community-area">
                    <img src={community.avatar_url} className="avatar" />
                    <a href={`/${community.name}`} className="name">{community.display_name}</a>
                </div>
            </div>
        </div>
    )
}