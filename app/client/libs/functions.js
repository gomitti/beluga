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

export const to_hex_string = object_id => {
    return has_toHexString(object_id) ? object_id.toHexString() : object_id
}

export const objectid_equals = (a, b) => {
    if (typeof a === "undefined") {
        return false
    }
    if (typeof b === "undefined") {
        return false
    }
    const a_str = has_toHexString(a) ? a.toHexString() : a
    const b_str = has_toHexString(b) ? b.toHexString() : b
    return a_str === b_str
}