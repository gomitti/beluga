export const ftp_mkdir = async (ftp, directory) => {
    return new Promise((resolve, reject) => {
        ftp.raw("mkd", directory, (error, data) => {
            if (error) {
                return reject(error)
            }
            return resolve(data)
        })
    })
}

export const ftp_put = async (ftp, data, directory) => {
    return new Promise((resolve, reject) => {
        ftp.put(data, directory, error => {
            if (error) {
                reject(error)
            }
            resolve()
        })
    })
}

export const ftp_ls = async (ftp, directory) => {
    return new Promise((resolve, reject) => {
        ftp.ls(directory, (error, res) => {
            if (error) {
                reject(error)
            }
            resolve(res)
        })
    })
}

export const ftp_delete = async (ftp, path) => {
    return new Promise((resolve, reject) => {
        ftp.raw("dele", path, error => {
            if (error) {
                reject(error)
            }
            resolve()
        })
    })
}

export const ftp_rmd = async (ftp, path) => {
    return new Promise((resolve, reject) => {
        ftp.raw("rmd", path, error => {
            if (error) {
                reject(error)
            }
            resolve()
        })
    })
}