import { Component } from "react"


const map_unicode_shortname = {}
for (const unicode in emoji_list) {
    const detail = emoji_list[unicode]
    const { category, shortname, diversity } = detail
    if (diversity) {
        continue
    }
    map_unicode_shortname[unicode.toLowerCase()] = shortname.replace(/:/g, "")
}
console.log(map_unicode_shortname)

const map_shortname_position = {}

export const read = file => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            const name = file.name.replace(/\..+$/, "") // 拡張子を削る
            const shortname = map_unicode_shortname[name]
            if (shortname) {
                return resolve({
                    "src": reader.result,
                    "shortname": shortname
                })
            }
            return reject()
        }
        reader.readAsDataURL(file)
    })
}


export default class App extends Component {
    onFileChange = async () => {
        const { files } = event.target
        console.log(files.length, "files loaded")

        const results = []
        for (let j = 0; j < files.length; j++) {
            const file = files.item(j)
            try {
                const ret = await read(file)
                results.push(ret)
            } catch (error) {

            }
        }

        console.log(results.length, "files accepted")

        const cols = 20
        const size = 48
        const rows = Math.ceil(results.length / cols)
        const canvas = document.getElementById("canvas")
        canvas.width = cols * size
        canvas.height = rows * size

        const ctx = canvas.getContext("2d")
        let h = -1
        for (let j = 0; j < results.length; j++) {
            if (j % cols === 0) {
                h += 1
            }
            const { src, shortname } = results[j]
            const img = new Image()
            img.onload = (() => {
                const _j = j
                const _h = h
                const _shortname = shortname
                return () => {
                    const x = size * (_j % cols)
                    const y = _h * size
                    ctx.drawImage(img, x + 1, y + 1, size - 2, size - 2)
                    map_shortname_position[_shortname] = {
                        "x": x / 2,
                        "y": y / 2
                    }
                }
            })()
            img.src = src
        }
        this.refs.file.value = ""
    }
    renderResult = event => {
        event.preventDefault()
        const canvas = document.getElementById("canvas")
        const img = canvas.toDataURL("image/png")
        this.refs.result.src = img
        let style = ""
        for (const shortname in map_shortname_position) {
            const position = map_shortname_position[shortname]
            const { x, y } = position
            style += `
.emojione-4-shortname-${shortname} {
    background-position: -${x}px -${y}px;
}`
        }
        this.refs.style.value = style
    }
    render() {
        return (
            <div className="form">
                <input type="file" ref="file" accept="image/*, video/*" onChange={this.onFileChange} multiple />
                <canvas id="canvas" width="200" height="200"></canvas>
                <button onClick={this.renderResult}>render</button>
                <img ref="result" />
                <textarea ref="style"></textarea>
            </div>
        )
    }
}