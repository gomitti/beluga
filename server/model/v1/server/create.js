import config from "../../../config/beluga"
import storage from "../../../config/storage"
import api from "../../../api"
import logger from "../../../logger"

export default async (db, params) => {
	const user = await api.v1.user.show(db, { "id": params.user_id })
	if(!user){
		throw new Error("ユーザーが見つかりません")
	}

	const server = await api.v1.server.create(db, params)

	// ルームを作成する
	const query = { "tagname": "general", "server_id": server.id, "user_id": params.user_id }
	try {
		const hashtag = await api.v1.hashtag.create(db, query)
	} catch (error) {
		// ロールバック
		const result = await api.v1.server.destroy(db, {
			"server_id": server.id,
			"user_id": params.user_id
		})
		logger.log({
			"level": "error",
			"message": "Failed to create a server",
			"error": error.toString(),
			server,
			params
		})
		throw new Error("サーバーで問題が発生しました")
	}
	const remote = storage.servers[0]
	try {
		await api.v1.server.avatar.reset(db, server, remote)
	} catch (error) {
		logger.log({
			"level": "error",
			"message": "Failed to create a server",
			"error": error.toString(),
			server,
			remote
		})
		const collection = db.collection("users")
		const result = await collection.deleteOne({
			"name": params.name
		})
		throw error
	}
	return server
}