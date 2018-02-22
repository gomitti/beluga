import logger from "./logger"

export const is_string = value => {
	return typeof value === "string"
}
export const is_object = value => {
	return typeof value === "object"
}
export const is_number = value => {
	return typeof value === "number"
}
export const is_array = value => {
	return value instanceof Array
}
export const key_exists = (key, params) => {
	return key in params
}

const assert = (expression, message) => {
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

assert.is_string = is_string
assert.is_object = is_object
assert.is_number = is_number
assert.is_array = is_array
assert.key_exists = key_exists

export default assert