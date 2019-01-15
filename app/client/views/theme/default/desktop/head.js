import { Component } from "react"
import Head from "next/head"
import version from "../../../../version"

const hex_to_rgba = (hex, alpha) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        const r = parseInt(result[1], 16)
        const g = parseInt(result[2], 16)
        const b = parseInt(result[3], 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return "rgba(0, 0, 0, 0)"
}

const BackgroundImageStyle = ({ background_image }) => {
    if (background_image) {
        return (
            <style>{`
                body {
                    background-image: url(${background_image});
                }
            `}</style>
        )
    }
    return null
}
export default class HeadView extends Component {
    render() {
        const { platform, logged_in_user, title } = this.props
        const color = (logged_in_user && logged_in_user.profile) ? logged_in_user.profile.theme_color : "#477da7"
        const background_image = (logged_in_user && logged_in_user.profile.use_background_image) ? logged_in_user.profile.background_image : null
        return (
            <Head>
                <meta charSet="utf-8" />
                <meta http-equiv="content-language" content="ja" />
                <link rel="stylesheet" href={`/css/theme/default/desktop/style.css?${version}`} />
                {platform ? <link rel="stylesheet" href={`/css/theme/default/desktop/${platform}.css?${version}`} /> : null}
                <title>{title}</title>
                <style>{`
                    a,
                    a:hover{
                        color: ${color};
                    }
                    .user-defined-color,
                    .user-defined-color-active.active,
                    .user-defined-color-hover:hover {
                        color: ${color} !important;
                    }
                    .user-defined-bg-color,
                    .user-defined-bg-color-hover:hover {
                        background-color: ${color};
                    }
                    .user-defined-transparent-bg-color,
                    .user-defined-transparent-bg-color-hover:hover {
                        background-color: ${hex_to_rgba(color, 0.1)};
                    }
                    .webkit-scrollbar::-webkit-scrollbar-thumb {
                        background-color: ${hex_to_rgba(color, 0.8)};
                    }
                    .react-toggle--checked .react-toggle-track {
                        background-color: ${color};
                    }
                    .react-toggle--checked .react-toggle-thumb {
                        border-color: ${color};
                    }
                    .user-defined-border-color-focus:focus,
                    .user-defined-border-color-hover:hover,
                    .user-defined-border-color-drag-entered.drag-entered,
                    .user-defined-border-color-active.active {
                        border-color: ${color} !important;
                    }
                    .navigationbar-menu:hover > li > a.active:hover {
                        color: ${color} !important;
                        border-color: ${color} !important;
                    }
                    .status-header > .inside > .link:hover > .display-name {
                        color: ${color} !important;
                    }
                `}</style>
                <BackgroundImageStyle background_image={background_image} />
            </Head>
        );
    }
}