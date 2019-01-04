import config from "./beluga.config"
import path from "path"
let ws = undefined

if (typeof window !== "undefined") {
    const components = location.href.split("/")
    let endpoint = ""
    for (let i = 3; i < components.length; i++) {
        endpoint = path.join(endpoint, components[i])
    }
    const http = location.href.match(/https?/)[0]
    const protocol = (http === "https") ? "wss" : "ws"
    class WebSocketClient {
        constructor() {
            this.listeners = []
            this.ws = null
            this.initial_reconnect_interval = 1000
            this.max_reconnect_interval = 30000
            this.reconnect_decay = 1.5
            this.reconnect_interval = this.initial_reconnect_interval
            this.timer_id = 0
            this.initWebSocket()
        }
        initWebSocket() {
            if (this.ws) {
                this.listeners.forEach(listener => {
                    this.ws.removeEventListener(listener.name, listener.callback)
                })
            }
            const url = `${protocol}://${config.domain}:${config.websocket_port}/${endpoint}`
            console.log(`connecting ${url}`)
            this.ws = new WebSocket(url)
            this.ws.onerror = (e) => {
                console.log("onerror", e)
            }
            this.ws.onclose = (e) => {
                console.log("onclose", e)
                clearTimeout(this.timer_id)
                this.timer_id = setTimeout(() => this.initWebSocket(), this.reconnect_interval);
                this.reconnect_interval = Math.min(this.max_reconnect_interval, this.reconnect_interval * this.reconnect_decay)
            }
            this.ws.onopen = (e) => {
                console.log("onopen", e)
                this.reconnect_interval = this.initial_reconnect_interval
            }
            this.ws.onerror = (e) => {
                console.log("onerror", e)
            }
            this.listeners.forEach(listener => {
                this.ws.addEventListener(listener.name, listener.callback)
            })
        }
        addEventListener(name, callback) {
            this.listeners.push({ name, callback })
            this.ws.addEventListener(name, callback)
        }
    }
    ws = new WebSocketClient()
}
export default ws