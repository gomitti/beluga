import HeaderComponent from "../../../../views/desktop/common/header"
import Head from "../../../../views/desktop/common/head"
import Component from "../../../../views/app"

export default class App extends Component {
    render() {
        const { channels, logged_in_user } = this.props
        const channelListComponent = channels ? channels.map(channel => {
            return <p><a href={`/${channel.community.name}/${channel.name}`}>${channel.community.name} / #{channel.name}</a></p>
        }) : null
        return (
            <div>
                <Head title="Beluga" />
                <HeaderComponent logged_in_user={logged_in_user} />
                {channelListComponent}
            </div>
        )
    }
}