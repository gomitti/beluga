export default ({ in_reply_to_status }) => {
    const { community, channel } = in_reply_to_status
    if (community && channel) {
        return (
            <div className="timeline-header-component">
                <div className="inside">
                    <div className="label-area thread">
                        <span className="label">スレッド</span>
                        <span className="divider"></span>
                        <a className="link" href={`/${community.name}/${channel.name}`}>
                            <span className="icon channel"></span>
                            <span className="label">{channel.name}</span>
                        </a>
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className="timeline-header-component">
            <div className="inside">
                <div className="label-area">
                    <span className="label">スレッド</span>
                </div>
            </div>
        </div>
    )
}