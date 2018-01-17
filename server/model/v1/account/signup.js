import api from "../../../api"
import storage from "../../../config/storage"
import logger from "../../../logger"

export default async (db, params) => {
	const user = await api.v1.account.signup(db, params)
	user.id = user._id
	for (const key in user) {
		if (key.indexOf("_") == 0) {
			delete user[key]
		}
	}
	const server = storage.servers[0]
	try {
		await api.v1.account.avatar.reset(db, user, server)
	} catch (error) {
		logger.log({
			"level": "error",
			"message": "Failed to signup",
			"error": error.toString(),
			server,
			user,
		})
		const collection = db.collection("users")
		const result = await collection.deleteOne({
			"name": params.name
		})
		throw error
	}
	return user
}