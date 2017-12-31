let push = undefined

if (typeof window !== "undefined") {
	// 通知の許可
	if (window.Notification !== undefined) {
		if (Notification.permission !== "denied") {
			Notification.requestPermission(_ => {

			});
		}
	}

	// 通知音
	const AudioContext = window.AudioContext || window.webkitAudioContext;
	const context = new AudioContext();

	const getAudioBuffer = (url, fn) => {
		const req = new XMLHttpRequest();
		req.responseType = "arraybuffer";
		req.onreadystatechange = () => {
			if (req.readyState === 4) {
				if (req.status === 0 || req.status === 200) {
					context.decodeAudioData(req.response, function (buffer) {
						fn(buffer);
					});
				}
			}
		}
		req.open("GET", url, true);
		req.send("")
	}

	getAudioBuffer("/sounds/notification.mp3", (buffer) => {
		window.audio = window.audio || {}
		window.audio.notification = buffer
	})

	push = (title, options) => {
		if (Notification.permission !== "granted") {
			return
		}
		if (document.hasFocus()) {
			return
		}
		const notification = new Notification(title, options);
		setTimeout(notification.close.bind(notification), 5000);

		const buffer = window.audio.notification
		if (buffer) {
			const source = context.createBufferSource();
			source.buffer = buffer;
			source.connect(context.destination);
			source.start(0);
		}
	}
}

export {push}