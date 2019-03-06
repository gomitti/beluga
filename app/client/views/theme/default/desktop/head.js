import { Component } from "react"
import convert from "color-convert"
import Head from "next/head"
import version from "../../../../version"

const hex_to_rgba_string = (hex, alpha) => {
    const rgb = convert.hex.rgb(hex)
    const r = rgb[0]
    const g = rgb[1]
    const b = rgb[2]
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const hex_to_gradient_string = hex => {
    const hsv = convert.hex.hsv(hex)
    const hsv_start = [hsv[0], hsv[1], hsv[2] + 5]
    const hsv_end = [hsv[0], hsv[1], hsv[2] - 5]
    const rgb_start = convert.hsv.rgb(hsv_start)
    const rgb_end = convert.hsv.rgb(hsv_end)
    return `radial-gradient(at left top, rgb(${rgb_start[0]}, ${rgb_start[1]}, ${rgb_start[2]}) 0%, rgb(${rgb_end[0]}, ${rgb_end[1]}, ${rgb_end[2]}) 100%)`
}

const hex_to_box_shadow_string = hex => {
    const hsv = convert.hex.hsv(hex)
    const rgb = convert.hsv.rgb([hsv[0], hsv[1], Math.min(255, hsv[2] + 20)])
    return `0 2px 8px rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`
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
export default class HeadComponent extends Component {
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
                    .user-defined-gradient-bg-color,
                    .user-defined-gradient-bg-color-hover:hover {
                        background-color: ${color};
                        background-image: ${hex_to_gradient_string(color)};
                    }
                    .user-defined-button-box-shadow-color {
                        box-shadow: ${hex_to_box_shadow_string(color)};
                    }
                    .user-defined-transparent-bg-color,
                    .user-defined-transparent-bg-color-hover:hover {
                        background-color: ${hex_to_rgba_string(color, 0.1)};
                        console.log(convert.hex.rgb(hex), )
                    }
                    .webkit-scrollbar::-webkit-scrollbar-thumb {
                        background-color: ${hex_to_rgba_string(color, 0.8)};
                        console.log(convert.hex.rgb(hex), )
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