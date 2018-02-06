const use_https = false
export default {
	"https": use_https,
	"port": {
		"websocket": 8080,
		"app": 3000
	},
	"status": {
		"max_text_length": 5000,
		"reaction": {
			"limit": 3,	// 1投稿につき何種類の絵文字を追加できるか
			"allow_self_reactions": false	// 自分自身へのリアクションの追加を許可
		},
		"embed": {
			"web": {
				// 1つの投稿にURLの埋め込みを何個まで許可するか
				// サーバー側でHTTPリクエストが発生するため大量の埋め込みを行うと負荷がかかる
				"limit": 3,
				"timeout": 3000,		// ミリ秒
				"max_description_length": 200
			}
		}
	},
	"colors": ["#B9C4CA", "#E09580", "#E5D8CE", "#EBE39B", "#F9D2C9", "#FCC8B2", "#E5A0A6", "#B3D9DD",
		"#AD8FCF", "#8684DE", "#79CBD2", "#A9C8A2", "#C784C8", "#F8C785", "#B4BEBD", "#E3D4DA",
		"#E6AECD", "#EA9895", "#A6CAE5", "#45A8C1", "#F4DA94", "#77A6F6"],
	"gradients": [
		["#fad0c4", "#ff9a9e"], ["#fbc2eb", "#a18cd1"], ["#fee140", "#fa709a"], ["#89f7fe", "#66a6ff"],
		["#56ccf2", "#2f80ed"], ["#f8ffae", "#43c6ac"], ["#ffe259", "#ffa751"]
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
			"image_size": 300,
			"max_description_length": 5000,
			"max_location_length": 100,
			"default_theme_color": "#477da7"
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
		"directory": "/path/to/log/dir"
	},
	"tmp": {
		"directory": "/path/to/tmp/dir"
	},
	"slug": {
		"timeline": {
			"server": "world",
			"global": "universe",
		}
	},
	"media": {
		"image": {
			"max": {
				"filesize": 1024 * 1024 * 10,
				"width": 20000,
				"height": 20000
			},
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
			"allowed_file_types": ["mp4", "mov"],
			"unsupported_codecs": ["MPEG-4 part 2"],
			"max": {
				"filesize": 1024 * 1024 * 40,
				"width": 3840,
				"height": 2160
			}
		},
		"list": {
			"count": {
				"max": 500,		// 1回のAPIリクエストで取得できる上限
				"default": 20
			}
		}
	}
}