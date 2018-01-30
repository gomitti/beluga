import { Component } from "react"
import { useStrict } from "mobx"
import ReactCrop, { makeAspectCrop } from "react-image-crop"
import Head from "../../../../views/desktop/default/head"
import config from "../../../../beluga.config"
import { request } from "../../../../api"

// mobxの状態をaction内でのみ変更可能にする
useStrict(true)

export default class App extends Component {
	static async getInitialProps({ query }) {
		return { ...query }
	}
	constructor(props) {
		super(props)
		this.state = {
			crop: {
				x: 0,
				y: 0,
			},
			maxHeight: 100,
			shape: {
				width: -1,
				height: -1
			},
			src: null,
			extension: null,
			preview_src: null,
			is_ready: false
		}
		if (request) {
			request.csrf_token = this.props.csrf_token
		}
		if (typeof history !== "undefined") {
			history.scrollRestoration = "manual"
		}
	}
	onImageLoaded = image => {
		console.log("onImageLoaded, image:", image)
		const { profile_image_size } = this.props
		const size = Math.min(image.naturalWidth, image.naturalHeight)
		if (size < profile_image_size) {
			alert(`画像サイズが小さすぎます。（${image.naturalWidth}x${image.naturalHeight} < ${profile_image_size}x${profile_image_size}）`)
		}
		this.setState({
			crop: makeAspectCrop({
				x: 0,
				y: 0,
				aspect: 1,
				width: 50,
			}, image.naturalWidth / image.naturalHeight),
			image,
			shape: {
				width: image.naturalWidth,
				height: image.naturalHeight
			},
			is_ready: true
		})
	}
	onCropComplete = (crop, pixelCrop) => {
		console.log("onCropComplete, pixelCrop:", pixelCrop)
		const base64 = this.getCroppedImg()
		this.setState({ preview_src: base64 })
	}
	onCropChange = crop => {
		this.setState({ crop })
	}
	getCroppedImg = () => {
		// cropは全ての値が%
		const { profile_image_size } = this.props
		const { crop, image, extension } = this.state
		const canvas = document.createElement("canvas")
		const dom = this.refs.module
		const scaled_width = dom.clientWidth
		const scaled_height = dom.clientHeight
		const original_width = image.naturalWidth
		const scale = original_width / scaled_width
		const square_width = crop.width / 100.0 * scaled_width * scale	// crop.widthは%
		if (square_width < profile_image_size) {
			alert(`切り抜き後のサイズが小さすぎます。（${Math.floor(square_width)} < ${profile_image_size}）`)
			return
		}
		console.log("scale:", scale)
		console.log("scaled_width:", scaled_width)
		console.log("original_width:", original_width)
		console.log("square_width:", square_width)
		const ctx = canvas.getContext("2d")
		console.log(crop)
		canvas.width = square_width
		canvas.height = square_width
		ctx.drawImage(
			image,
			crop.x * scaled_width / 100.0 * scale,
			crop.y * scaled_height / 100.0 * scale,
			square_width,
			square_width,
			0,
			0,
			square_width,
			square_width
		)

		return canvas.toDataURL(extension, 1.0)
	}
	crop = () => {
		if (this.state.is_ready === false) {
			alert("画像を選択してください")
			return
		}
		const base64 = this.getCroppedImg()
		this.setState({ preview_src: base64 })
		request
			.post("/account/avatar/update", {
				"data": base64
			})
			.then(res => {
				const data = res.data
				const { profile_image_url, success } = data
				if (success == false) {
					alert(data.error)
					return
				}
				this.setState({ "preview_src": profile_image_url })
				alert("保存しました")
			})
			.catch(error => {
				alert(error)
			})
	}
	reset = () => {
		request
			.post("/account/avatar/reset", { })
			.then(res => {
				const data = res.data
				const { profile_image_url, success } = data
				if (success == false) {
					alert(data.error)
					return
				}
				this.setState({ "preview_src": profile_image_url })
				alert("保存しました")
			})
			.catch(error => {
				alert(error)
			})
	}
	onFileChange = e => {
		const files = e.target.files
		if (files.length !== 1) {
			return
		}
		const file = files[0]
		const reader = new FileReader()
		reader.onload = (e) => {
			const src = reader.result
			const component = src.split(";")
			if (component.length !== 2) {
				alert("問題が発生しました。ブラウザを変えると解消する可能性があります。")
				return
			}
			const extension = component[0].replace("data:", "")
			const allowed_extensions = ["image/jpeg", "image/png"]
			if (!(allowed_extensions.includes(extension))) {
				alert("この拡張子には対応していません")
				return
			}
			console.log(extension)
			this.setState({ src, extension })
		}
		reader.readAsDataURL(file)
	}
	render() {
		const { profile_image_size } = this.props
		const { preview_src } = this.state
		return (
			<div className="crop-module">
				<div className="preview-container">
					<img src={preview_src} className="preview" />
				</div>
				<Head />
				<div ref="module">
					<ReactCrop
						{...this.state}
						profile_image_size={profile_image_size}
						onImageLoaded={this.onImageLoaded}
						onComplete={this.onCropComplete}
						onChange={this.onCropChange}
					/>
				</div>
				<input type="file" ref="file" accept="image/*" onChange={this.onFileChange} />
				<button className="button user-defined-bg-color" onClick={this.crop}>保存</button>
				<button className="button user-defined-bg-color" onClick={this.reset}>リセット</button>
			</div>
		)
	}
}