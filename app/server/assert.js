import logger from "./logger"

export const is_string = value => {
    return typeof value === "string"
}
export const is_bool = value => {
    return typeof value === "boolean"
}
export const is_object = value => {
    return typeof value === "object"
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
    const stack = error.stack.split("\n")
    logger.log({
        "level": "error",
        "error": "Assertion failed",
        "stack": stack
    })
    throw error
}