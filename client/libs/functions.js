export const convert_bytes_to_optimal_unit = bytes => {
    bytes /= 1024
    if (bytes < 1024) {
        return `${Math.floor(bytes)} KiB`
    }
    bytes /= 1024
    if (bytes < 1024) {
        return `${Math.floor(bytes)} MiB`
    }
    bytes /= 1024
    if (bytes < 1024) {
        return `${Math.floor(bytes)} GiB`
    }
    bytes /= 1024
    return `${Math.floor(bytes)} TiB`
}
