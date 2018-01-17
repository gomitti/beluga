import config from "./beluga.config"
let request = undefined
let upload = undefined

class Request {
	constructor() {
		const _axios = require("axios")
		const protocol = location.href.match(/https?/)[0]
		this.request = _axios.create({
			baseURL: `${protocol}://${config.domain}/api/v1/`,
			headers: {
				"Content-Type": "application/json"
			},
			responseType: "json"
		})
	}
	post(endpoint, query) {
		query = Object.assign({ "csrf_token": this.csrf_token }, query)
		return this.request.post(endpoint, query)
	}
	get(endpoint, query) {
		query = Object.assign({ "csrf_token": this.csrf_token }, query)
		return this.request.get(endpoint, query)
	}
}

if (typeof window != "undefined") {
	request = new Request()
}

export { request }