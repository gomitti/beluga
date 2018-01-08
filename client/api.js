import config from "./beluga.config"
let request = undefined
let upload = undefined

if (typeof window != "undefined") {
	const _axios = require("axios")
	const protocol = location.href.match(/https?/)[0]

	request = _axios.create({
		baseURL: `${protocol}://${config.domain}/api/v1/`,
		headers: {
			"Content-Type": "application/json"
		},
		responseType: "json"
	})
}

export { request }