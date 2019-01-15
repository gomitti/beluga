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

// hasOwnPropertyでは検出できない
const has_toHexString = x => {
    if (typeof x !== "object") {
        return false
    }
    return typeof x.toHexString === "function"
}

export const objectid_equals = (a, b) => {
    const a_str = has_toHexString(a) ? a.toHexString() : a
    const b_str = has_toHexString(b) ? b.toHexString() : b
    return a_str === b_str
}