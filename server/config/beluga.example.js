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
	"colors": ["#B9C4CA", "#E09580", "#E5D8CE", "#EBE39B", "#F9D2C9", "#FCC8B2", "#E5A0A6", "#B3D9DD",
		"#AD8FCF", "#5D6790", "#8684DE", "#79CBD2", "#A9C8A2", "#C784C8", "#F8C785", "#B4BEBD", "#E3D4DA",
		"#E6AECD", "#EA9895", "#A6CAE5", "#5982EE", "#45A8C1", "#F4DA94", "#77A6F6", "#63BA67"],
	"gradients": [
		["#fad0c4", "#ff9a9e"], ["#fbc2eb", "#a18cd1"], ["#f6d365", "#fda085"],
		["#d4fc79", "#96e6a1"], ["#f093fb", "#f5576c"], ["#00f2fe", "#4facfe"],
		["#fee140", "#fa709a"], ["#89f7fe", "#66a6ff"], ["#38ef7d", "#11998e"],
		["#56ccf2", "#2f80ed"], ["#ffd200", "#f7971e"], ["#f8ffae", "#43c6ac"],
		["#ffc371", "#ff5f6d"], ["#ffe259", "#ffa751"],
	],
	"memcached": {
		"capacity": 1000,
		"max_age": 86400 
	},
	"like": {
		"max_count": 10		// 投稿1つにつき何回まで「いいね」を押せるか
	},
	"user": {
		"max_name_length": 32,
		"max_display_name_length": 32,
		"name_regexp": /^[a-zA-Z0-9_]+$/,
		"profile": {
			"image": {
				"size": 300
			}
		},
	},
	"hashtag": {
		"max_tagname_length": 100		// UTF16基準なので注意。サロゲートペアは2文字扱いになる
	},
	"server": {
		"name_regexp": /^[a-zA-Z0-9_]+$/,
		"max_name_length": 32,			// UTF16基準なので注意
		"max_display_name_length": 100,	// UTF16基準なので注意
		"profile": {
			"image": {
				"size": 300
			}
		},
		"hashtags": {
			"min_count_to_display": 10	// ルーム一覧に表示される最低限の投稿数
		}
	},
	"auth": {
		"salt": "eS84Npxv",		// ここを運用開始後に変えるとログインができなくなるので注意
		"bcrypt_salt_round": 12,
		"password_regexp": /^[\x21-\x7E]+$/,	// asciiのみ
		"min_password_length": 4,
		"session": {
			"cookie_secret": "?[guL6]#",
			"cookie_name": "session_id",
			"secure": use_https,
			"max_age": 86400 * 7,		// 秒
			"timezone_offset": 9 * 3600	// 秒
		}
	},
	"timeline": {
		"count": {
			"max": 3000,
			"default": 20
		}
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
	"slug": {
		"timeline": {
			"server": "world",
			"global": "universe",
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