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

export default class HeadView extends Component {
    render() {
        const { platform, logged_in, title } = this.props
        const color = (logged_in && logged_in.profile) ? logged_in.profile.theme_color : "#477da7"
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
                    .user-defined-transparent-bg-color,
                    .user-defined-transparent-bg-color:hover {
                        background-color: ${hex_to_rgba(color, 0.1)};
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