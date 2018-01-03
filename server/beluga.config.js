const use_https = false
export default {
	"https": use_https,
	"status": {
		"max_text_length": 3000
	},
	"user": {
		"max_name_length": 32,
		"max_display_name_length": 32,
		"name_regexp": /^[a-zA-Z0-9_]+$/
	},
	"hashtag": {
		"max_tagname_length": 100		// UTF16基準なので注意。サロゲートペアは2文字扱いになる
	},
	"server": {
		"name_regexp": /^[a-zA-Z0-9_]+$/,
		"max_name_length": 32,		// UTF16基準なので注意。サロゲートペアは2文字扱いになる
		"max_display_name_length": 100		// UTF16基準なので注意。サロゲートペアは2文字扱いになる
	},
	"auth": {
		"salt": "eS84Npxv",		// ここを運用開始後に変えるとログインができなくなるので注意
		"bcrypt_salt_round": 12,
		"password_regexp": /^[\x21-\x7E]+$/,	// asciiのみ
		"session": {
			"cookie_secret": "?[guL6]#",
			"cookie_name": "session_crypto",
			"secure": use_https,
			"max_age": 86400 * 7,		// 秒
			"timezone_offset": 9 * 3600		// 秒
		}
	},
	"timeline": {
		"max_count": 500
	}
}