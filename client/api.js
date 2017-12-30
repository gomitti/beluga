const _axios = require("axios")
import config from "./beluga.config"

export const request = _axios.create({
	baseURL: `http://${config.domain}/api/v1/`,
	headers:{
		"Content-Type": "application/json"
	},
	responseType: "json"
})
