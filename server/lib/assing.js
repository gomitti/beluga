export const merge = (a, b) => {
	const obj = {}
	if (typeof a !== "object") {
		return obj
	}
	for (const key in a) {
		obj[key] = a[key]
	}
	if (typeof b !== "object") {
		return obj
	}
	for (const key in b) {
		const value = b[key]
		if (!(key in a)) {
			obj[key] = value
			continue
		}
		if (typeof value === "object") {
			obj[key] = merge(a[key], value)
			continue
		}
		if (Array.isArray(value)) {
			obj[key] = value.slice(0) || []
			continue
		}
		obj[key] = value
	}
	return obj
}
export default (...params) => {
	let obj = {}
	for (const param of params) {
		obj = merge(obj, param)
	}
	return obj
}