import gm from "gm"

export const gm_filesize = async (data) => {
	return new Promise((resolve, reject) => {
		gm(data).size(function (error, size) {
			if (error) {
				return reject(error)
			}
			return resolve(size)
		})
	})
}

export const gm_resize = async (data, width, height) => {
	return new Promise((resolve, reject) => {
		gm(data)
			.resize(width, height)
			.toBuffer(function (error, data) {
				if (error) {
					return reject(error)
				}
				return resolve(data)
			})
	})
}

export const gm_crop = async (data, width, height, x, y) => {
	return new Promise((resolve, reject) => {
		gm(data)
			.crop(width, height, x, y)
			.toBuffer(function (error, data) {
				if (error) {
					return reject(error)
				}
				return resolve(data)
			})
	})
}

export const gm_shape = async data => {
	return new Promise((resolve, reject) => {
		gm(data).size(function (error, size) {
			if (error) {
				return reject(error)
			}
			return resolve(size)
		})
	})
}

export const gm_noprofile = async data => {
	return new Promise((resolve, reject) => {
		gm(data)
			.noProfile()
			.toBuffer(function (error, data) {
				if (error) {
					return reject(error)
				}
				return resolve(data)
			})
	})
}

export const gm_coalesce = async data => {
	return new Promise((resolve, reject) => {
		gm(data)
			.selectFrame(0)
			.transparent("white")
			.setFormat("png")
			.toBuffer(function (error, data) {
				if (error) {
					return reject(error)
				}
				return resolve(data)
			})
	})
}

export const gm_draw = async (width, height, color_code) => {
	return new Promise((resolve, reject) => {
		gm(width, height, color_code)
			.toBuffer("png", function (error, data) {
				if (error) {
					return reject(error)
				}
				return resolve(data)
			})
	})
}