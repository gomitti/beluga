import ffprobe from "node-ffprobe"
import ffmpeg from "fluent-ffmpeg"

export const ff_metadata = async filepath => {
    return new Promise((resolve, reject) => {
        ffprobe(filepath, function (error, probeData) {
            if (error) {
                return reject(error)
            }
            return resolve(probeData)
        })
    })
}

export const ff_screenshot = async (video_filepath, poster_filename, directory) => {
    return new Promise((resolve, reject) => {
        ffmpeg(video_filepath)
            .on("end", function () {
                resolve()
            })
            .screenshots({
                count: 1,
                folder: directory,
                filename: poster_filename,
            })
    })
}