export default ({ community }) => {
    return (
        <div className="timeline-header-component">
            <div className="inside">
                <div className="label-area community-public-timeline">
                    <span className="icon community"></span>
                    <span className="label">パブリック</span>
                    <span className="divider"></span>
                    <div className="community-avatar-area">
                        <a className="link" href={`/${community.name}`}>
                            <img className="image" src={community.avatar_url} />
                        </a>
                    </div>
                    <a className="community-name" href={`/${community.name}`}>{community.display_name}</a>
                </div>
            </div>
        </div>
    )
}