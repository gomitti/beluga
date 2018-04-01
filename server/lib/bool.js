export const parse_bool_str = value => {
    if (typeof value === "boolean") {
        return value
    }
    if (typeof value === "string") {
        if (value === "false") {
            return false
        }
        if (value === "true") {
            return true
        }
    }
    if (typeof value === "number") {
        if (value === 0) {
            return false
        }
        if (value === 1) {
            return true
        }
    }
    return false
}