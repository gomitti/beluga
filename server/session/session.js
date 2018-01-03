export default class Session {
	constructor(id, encrypted_id, user_id, expires) {
		this.id = id
		this.encrypted_id = encrypted_id
		this.user_id = user_id
		this.expires = expires
	}
}