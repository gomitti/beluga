export const isString = (value) => {
	return typeof value === "string"
}
export const isNumber = (value) => {
	return typeof value === "number"
}
export const keyExists = (key, params) => {
	return key in params
}
export const checkIsString = (value) => {
	if(isString(value) == false){
		throw new Error(`${value} is not a string`)
	}
}
export const checkIsNumber = (value) => {
	if (isNumber(value) == false) {
		throw new Error(`${value} is not a number`)
	}
}
export const checkKeyExists = (key, params) => {
	if (keyExists(key, params) == false) {
		throw new Error(`${key} not found`)
	}
}