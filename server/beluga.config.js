export default {
	"status": {
		"max_text_length": 3000
	},
	"user": {
		"max_name_length": 32,
		"name_regexp": /^[a-zA-Z0-9_]+$/
	},
	"auth": {
		"salt": "eS84Npxv",		// ここを運用開始後に変えるとログインができなくなるので注意
		"bcrypt_salt_round": 12,
		"password_regexp": /^[\x21-\x7E]+$/	// asciiのみ
	}
}