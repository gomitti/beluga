import HeaderView from "../../../../views/desktop/common/header"
import Head from "../../../../views/desktop/common/head"
import Component from "../../../../views/app"

export default class App extends Component {
    render() {
        const { channels, logged_in } = this.props
        const channelListView = channels ? channels.map(channel => {
            return <p><a href={`/server/${channel.server.name}/${channel.name}`}>${channel.server.name} / #{channel.name}</a></p>
        }) : null
        return (
            <div>
                <Head title="Beluga" />
                <HeaderView logged_in={logged_in} />
                {channelListView}
            </div>
        )
    }
}