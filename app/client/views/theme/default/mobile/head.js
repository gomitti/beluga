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

export default class HeadComponent extends Component {
    render() {
        const { platform, logged_in_user, title } = this.props
        const color = (logged_in_user && logged_in_user.profile) ? logged_in_user.profile.theme_color : "#477da7"
        return (
            <Head>
                <meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0" />
                <meta charSet="utf-8" />
                <link rel="stylesheet" href={`/css/theme/default/mobile/style.css?${version}`} />
                {platform ? <link rel="stylesheet" href={`/css/theme/default/mobile/${platform}.css?${version}`} /> : null}
                <title>{title}</title><style>{`
					a,
					a:hover{
						color: ${color};
					}
					.user-defined-color,
					.user-defined-color-active.active {
						color: ${color} !important;
					}
					.user-defined-bg-color {
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
                    .user-defined-transparent-bg-color:hover {
                        background-color: ${hex_to_rgba_string(color, 0.1)};
                    }
					.react-toggle--checked .react-toggle-track {
						background-color: ${color};
					}
					.react-toggle--checked .react-toggle-thumb {
						border-color: ${color};
					}
					.user-defined-border-color-focus:focus,
					.user-defined-border-color-active.active {
						border-color: ${color} !important;
					}
				`}</style>
            </Head>
        );
    }
}