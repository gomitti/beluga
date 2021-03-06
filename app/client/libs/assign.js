const copy = (target, source) => {
    for (const key in source) {
        const value = source[key]
        if (value === null) {
            target[key] = value
            continue
        }
        if (value instanceof Buffer) {
            target[key] = value
            continue
        }
        if (value instanceof ArrayBuffer) {
            target[key] = value
            continue
        }
        if (Array.isArray(value)) {
            target[key] = value.slice(0) || []
            continue
        }
        if (typeof value === "object") {
            if (typeof value.toHexString === "function") {
                target[key] = value.toHexString()
                continue
            }
            target[key] = copy({}, value)
            continue
        }
        target[key] = value
    }
    return target
}
export const merge = (target, source) => {
    let obj = {}
    if (typeof target !== "object") {
        return obj
    }
    if (typeof source !== "object") {
        return target
    }
    obj = copy(obj, target)
    obj = copy(obj, source)
    return obj
}
export default (...params) => {
    let obj = {}
    params.forEach(param => {
        obj = merge(obj, param)
    })
    return obj
}