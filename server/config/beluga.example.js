const use_https = false
export default {
	"https": use_https,
	"port": {
		"websocket": 8080,
		"app": 3000
	},
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
		"max_name_length": 32,			// UTF16基準なので注意
		"max_display_name_length": 100	// UTF16基準なので注意
	},
	"auth": {
		"salt": "eS84Npxv",		// ここを運用開始後に変えるとログインができなくなるので注意
		"bcrypt_salt_round": 12,
		"password_regexp": /^[\x21-\x7E]+$/,	// asciiのみ
		"session": {
			"cookie_secret": "?[guL6]#",
			"cookie_name": "session_id",
			"secure": use_https,
			"max_age": 86400 * 7,		// 秒
			"timezone_offset": 9 * 3600	// 秒
		}
	},
	"timeline": {
		"max_count": 500
	},
	"websocket": {
		"https": {
			"key": "/path/to/privkey.pem",
			"cert": "/path/to/fullchain.pem"
		}
	},
	"log": {
		"path": "/path/to/log/dir"
	},
	"profile": {
		"image": {
			"size": 300,
			"default": {
				"colors": ["#D24D57", "#E74C3C", "#DB0A5B", "#D2527F", "#947CB0", "#674172",
					"#913D88", "#9B59B6", "#446CB3", "#336E7B", "#2574A9", "#91B496", "#1BBC9B",
					"#F5D76E", "#FABE58", "#FDE3A7", "#F2784B", "#F27935", "#049372"]
			}
		}
	},
	"media": {
		"image": {
			"max_filesize": 1024 * 1024 * 5,
			"thumbnail": {
				"square": {
					"size": 300
				},
				"small": {
					"size": 800
				},
				"medium": {
					"size": 1600
				}
			}
		},
		"video": {
			"max_filesize": 1024 * 1024 * 40
		}
	}
}