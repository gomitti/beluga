export default class Session {
	constructor(id, encrypted_id, user_id, expires, ip_address, user_agent) {
		this.id = id
		this.encrypted_id = encrypted_id
		this.user_id = user_id
		this.expires = expires
		this.ip_address = ip_address
		this.user_agent = user_agent
		this.auth_type = "cookie"
	}
}