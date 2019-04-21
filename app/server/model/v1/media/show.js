import storage from "../../../config/storage"
import memcached from "../../../memcached"

const map_host_uri = {}
storage.servers.forEach(server => {
    const protocol = server.https ? "https" : "http"
    map_host_uri[server.host] = `${protocol}://${server.url_prefix}.${server.domain}`
})

export default async (db, params) => {
    const media = await memcached.v1.media.show(db, { "id": params.id })
    if (media === null) {
        return null
    }

    const { prefix, extension, host, directory, id, created_at, bytes } = media
    if (!!(prefix && extension && host && directory && bytes) === false) {
        return null
    }
    const uri = map_host_uri[host]
    if (!!uri === false) {
        return null
    }
    const source = `${uri}/${directory}/${prefix}.${extension}`
    return {
        id,
        uri,
        bytes,
        source,
        prefix,
        directory,
        extension,
        created_at,
        "is_video": !!media.is_video,
        "is_image": !!media.is_image,
    }
}