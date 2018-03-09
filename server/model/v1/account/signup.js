import api from "../../../api"
import storage from "../../../config/storage"
import logger from "../../../logger"

export default async (db, params) => {
	const user_id = await api.v1.account.signup(db, params)
	const remote = storage.servers[0]
	try {
		await api.v1.account.avatar.reset(db, {
			user_id,
			"storage": remote
		})
	} catch (error) {
		logger.log({
			"level": "error",
			"message": "Failed to signup",
			"error": error.toString(),
			remote,
			user_id,
		})
		throw new Error("アカウントの作成処理が異常終了しました。サイト管理者にお知らせください。")
	}
	return user_id
}