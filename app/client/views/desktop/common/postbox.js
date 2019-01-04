import React, { Component } from "react"
import { request } from "../../../api"

export default class PostboxView extends Component {
    post() {
        if (this.pending === true) {
            return
        }
        this.pending = true
        const textarea = this.refs.textarea
        const text = textarea.value
        if (text.length == 0) {
            alert("本文を入力してください")
            this.pending = false
            return
        }
        const query = { text }
        // チャンネルへの投稿
        if (this.props.channel) {
            query.channel_id = this.props.channel.id
        }
        // ユーザーのホームへの投稿
        if (this.props.user && this.props.server) {
            query.recipient_id = this.props.user.id
            query.server_id = this.props.server.id
        }
        request
            .post("/status/update", query)
            .then(res => {
                const data = res.data
                if (data.success == false) {
                    alert(data.error)
                    return
                }
                textarea.value = ""
            })
            .catch(error => {
                alert(error)
            })
            .then(_ => {
                textarea.focus()
                this.pending = false
            })
    }

    onKeyUp = event => {
        if (event.keyCode == 16) {
            this.is_shift_key_down = false
            return
        }
        if (event.keyCode == 17) {
            this.is_ctrl_key_down = false
            return
        }
    }

    onKeyDown = event => {
        if (event.keyCode == 16) {
            this.is_shift_key_down = true
            if (this.timer_shift) {
                clearTimeout(this.timer_shift)
            }
            this.timer_shift = setTimeout(function () {
                this.is_shift_key_down = false
            }.bind(this), 5000)
        }
        if (event.keyCode == 17) {
            this.is_ctrl_key_down = true
            if (this.timer_ctrl) {
                clearTimeout(this.timer_ctrl)
            }
            this.timer_ctrl = setTimeout(function () {
                this.is_ctrl_key_down = false
            }.bind(this), 5000)
        }
        if (event.keyCode == 13) {
            let textarea = this.refs.textarea
            if (this.is_shift_key_down) {
                event.preventDefault()
                this.post()
                return
            }
            if (this.is_ctrl_key_down) {
                event.preventDefault()
                this.post()
                return
            }
            return
        }
    }

    onFileChange = event => {
        const files = event.target.files
        console.log(files)
        files.forEach(file => {
            const reader = new FileReader()
            reader.onload = (event) => {
                request
                    .post("/media/image/upload", {
                        "data": reader.result
                    })
                    .then(res => {
                        const data = res.data
                        if (data.error) {
                            alert(data.error)
                            return
                        }
                        const url = data.urls.original
                        if (this.refs.textarea.value.length == 0) {
                            this.refs.textarea.value = url
                        } else {
                            this.refs.textarea.value = this.refs.textarea.value + "\n" + url
                        }
                    })
                    .catch(error => {
                        alert(error)
                    })
                    .then(_ => {
                    })
            }
            reader.readAsDataURL(file)
        })
    }

    render() {
        if (!this.props.logged_in) {
            return (
                <div>投稿するにはログインしてください</div>
            )
        }
        return (
            <div>
                <div><textarea ref="textarea" onKeyUp={this.onKeyUp} onKeyDown={this.onKeyDown} /></div>
                <div><button className="button" onClick={this.post}>投稿する</button></div>
                <input type="file" ref="file" accept="image/*, video/*" onChange={this.onFileChange} multiple />
            </div>
        );
    }
}