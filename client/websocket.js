let ws = undefined
import config from "./beluga.config"

if (typeof window != "undefined") {
	ws = new WebSocket(`ws://${config.domain}:${config.websocket_port}`)
	ws.onerror = (e) => {
		console.log("onerror", e)
	}
	ws.onclose = (e) => {
		console.log("onclose", e)
	}
	ws.onopen = (e) => {
		console.log("onopen", e)
	}
	ws.onerror = (e) => {
		console.log("onerror", e)
	}
}
export default ws