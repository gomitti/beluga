export const created_at_to_elapsed_time = created_at => {
    let diff = Math.floor((Date.now() - created_at) / 1000)
    if (diff < 60) {
        return diff + "秒前"
    }
    diff = Math.floor(diff / 60)
    if (diff < 59) {
        return diff + "分前"
    }
    diff = Math.floor(diff / 60)
    if (diff < 24) {
        return diff + "時間前"
    }
    diff = Math.floor(diff / 24)
    if (diff < 7) {
        return diff + "日前"
    }
    diff = Math.floor(diff / 7)
    if (diff < 52) {
        const date = new Date(created_at)
        return `${(date.getMonth() + 1)}月${date.getDate()}日`
    }
    const date = new Date(created_at)
    return `${date.getFullYear()}年${(date.getMonth() + 1)}月${date.getDate()}日`
}

export const time_string_from_create_at = created_at => {
    const date = new Date(created_at)
    const hours = date.getHours()
    const minutes = "0" + date.getMinutes()
    const formatted_time = hours + ":" + minutes.substr(-2)
    return formatted_time
}

export const date_string_from_create_at = created_at => {
    const date = new Date(created_at)
    const year = date.getFullYear()
    const month = ("0" + (date.getMonth() + 1)).substr(-2)
    const day = ("0" + date.getDate()).substr(-2)
    const hours = ("0" + date.getHours()).substr(-2)
    const minutes = ("0" + date.getMinutes()).substr(-2)
    const seconds = ("0" + date.getSeconds()).substr(-2)
    const formatted_time = `${year}/${month}/${day} ${hours}:${minutes.substr(-2)}:${seconds}`
    return formatted_time
}