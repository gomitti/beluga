export const is_string = value => {
    return typeof value === "string"
}
export const is_object = value => {
    return typeof value === "object"
}
export const is_function = value => {
    return typeof value === "function"
}
export const is_number = value => {
    return typeof value === "number"
}
export const is_array = value => {
    return Array.isArray(value)
}
export const key_exists = (key, params) => {
    return key in params
}

export default (expression, message) => {
    if (!!expression === true) {
        return
    }
    const error = new Error(message)
    if (typeof alert !== "undefined") {
        alert(`Assertion failed: ${message} ${error.stack}`)
    }
    console.log(`Assertion failed: ${message}`)
    console.log(error.stack)
    throw error
}