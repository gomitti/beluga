import config from "./beluga.config"

class Request {
    constructor() {
        const _axios = require("axios")
        const protocol = typeof location !== "undefined" ? location.href.match(/https?/)[0] : "http"
        this.request = _axios.create({
            "baseURL": `${protocol}://${config.domain}/api/v1/`,
            "headers": {
                "Content-Type": "application/json"
            },
            "responseType": "json"
        })
    }
    post(endpoint, query, config) {
        query = Object.assign({ "csrf_token": this.csrf_token }, query)
        return this.request.post(endpoint, query, config)
    }
    get(endpoint, query, config) {
        query = Object.assign({ "csrf_token": this.csrf_token }, query)
        return this.request.get(endpoint, query, config)
    }
    set_csrf_token = csrf_token => {
        this.csrf_token = csrf_token
    }
}

export const request = new Request()