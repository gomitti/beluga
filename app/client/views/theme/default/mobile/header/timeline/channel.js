export default ({ channel }) => {
    return (
        <div className="timeline-header-component">
            <div className="inside">
                <div className="label-area">
                    <span className="icon channel"></span>
                    <span className="label">{channel.name}</span>
                </div>
            </div>
        </div>
    )
}