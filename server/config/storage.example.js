// パスワードは必ず変更する
// iptablesでメインのサーバーからの接続以外を遮断する
const domain = "example.com"
export default {
	"servers": [
		{
			"host": "localhost",
			"port": 21,
			"user": "ftp",
			"password": "ftp",
			"url_prefix": "static1",	// ユーザーがファイルにアクセする時のURL
			"domain": domain,			// http://${url_prefix}.${domain}/
			"available": true,
			"https:": false
		}
	]
}