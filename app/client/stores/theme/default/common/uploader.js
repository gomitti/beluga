import { observable, action, computed } from "mobx"
import { sync as uid } from "uid-safe"
import assert from "../../../../assert"
import { request } from "../../../../api"


class Metadata {
    @observable loaded = 0
    @observable total = 0
    @observable is_uploading = false
    @observable done = false
    @observable failed = false
    constructor(file) {
        this.name = file.name
        this.size = file.size
    }
    @computed get percent() {
        if (this.total <= 0) {
            return 0
        }
        return this.loaded / this.total
    }
    @action.bound
    update(loaded, total) {
        this.loaded = loaded
        this.total = total
    }
}

export default class UploadManager {
    uploading_files = []
    @observable uploading_file_metadatas = []

    @action.bound
    add = file => {
        const metadata = new Metadata(file)
        this.uploading_file_metadatas.push(metadata)
        this.uploading_files.push(file)
        this.uploadNextIfNeeded()
    }

    uploadNextIfNeeded = () => {
        assert(this.uploading_file_metadatas.length === this.uploading_files.length)
        if (this.uploading_file_metadatas.length > 0) {
            const metadata = this.uploading_file_metadatas[0]
            if (metadata.is_uploading) {
                return
            }
            metadata.is_uploading = true
            const file = this.uploading_files[0]
            this.upload(file, metadata)
        }
    }

    reject = (file, metadata) => {
        metadata.is_uploading = false
        metadata.failed = true
        this.uploading_files.splice(0, 1)
        this.uploading_file_metadatas.splice(0, 1)
        this.uploadNextIfNeeded()
    }

    @action.bound
    upload = (file, metadata) => {
        const endpoint = file.type.indexOf("video") === 0 ? "/api/v1/media/video/upload" : "/api/v1/media/image/upload"
        const reader = new FileReader()
        reader.onabort = event => {
            this.reject(file, metadata)
        }
        reader.onerror = event => {
            this.reject(file, metadata)
        }
        reader.onloadend = event => {
            const blob = new Blob([reader.result], { "type": "application/octet-stream" })
            const xhr = new XMLHttpRequest()
            xhr.upload.addEventListener("progress", event => {
                metadata.update(event.loaded, event.total)
            })
            xhr.responseType = "json"
            xhr.open("POST", endpoint)
            const formdata = new FormData()
            formdata.append("csrf_token", request.csrf_token)
            formdata.append("data", new Blob([reader.result], { "type": "application/octet-stream" }))
            xhr.onload = () => {
                if (xhr.status !== 200) {
                    this.reject(file, metadata)
                    return
                }
                const data = xhr.response
                if (data.error) {
                    if (this.error_callback) {
                        this.error_callback(data.error)
                    }
                    this.reject(file, metadata)
                    return
                }
                const url = data.urls.original
                if (this.uploaded_callback) {
                    this.uploaded_callback(url)
                }
                this.didUploadFile(file, metadata)
            }
            xhr.send(formdata)
        }
        reader.readAsArrayBuffer(file)
    }

    @action.bound
    didUploadFile = (file, metadata) => {
        metadata.is_uploading = false
        metadata.done = true
        this.uploading_files.splice(0, 1)
        this.uploading_file_metadatas.splice(0, 1)
        this.uploadNextIfNeeded()
    }
}