export default class Session {
	constructor(user_id) {
		this.user_id = user_id
		this.auth_type = "access_token"
	}
}