let ws = undefined
import config from "./beluga.config"

if (typeof window != "undefined") {
	const http = location.href.match(/https?/)[0]
	const protocol = (http == "https") ? "wss" : "ws"
	ws = new WebSocket(`${protocol}://${config.domain}:${config.websocket_port}`)
	ws.onerror = (e) => {
		console.log("onerror", e)
	}
	ws.onclose = (e) => {
		console.log("onclose", e)
		alert("切断されました")
	}
	ws.onopen = (e) => {
		console.log("onopen", e)
	}
	ws.onerror = (e) => {
		console.log("onerror", e)
	}
}
export default ws