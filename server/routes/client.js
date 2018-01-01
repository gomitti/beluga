const next = require("next")
const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

const device_type = req => {
	var ua = req.headers["user-agent"];
	if (ua.match(/mobile/i)) {
		return "mobile"
	}
	return "desktop"
}

module.exports = (fastify, options, next) => {
	fastify.next("/", (app, req, res) => {
		const db = fastify.mongo.db
		const collection = db.collection("statuses")
		let statuses = []
		collection
			.find({}, { sort: { "created_at": -1 }, limit: 30 })
			.toArray()
			.then(documents => {
				statuses = documents
			}).catch(error => {
			}).then(document => {
				app.render(req.req, res.res, `/${device_type(req)}/`, { statuses })
			})
	})
	fastify.next("/signup", (app, req, res) => {
		app.render(req.req, res.res, `/${device_type(req)}/signup`, {})
	})
	fastify.next("/login", (app, req, res) => {
		app.render(req.req, res.res, `/${device_type(req)}/login`, {})
	})

	// Nextは.jsを動的に生成するため、最初の1回はここで生成する
	// 2回目以降はNginxのproxy_cacheが効くのでここは呼ばれない
	fastify.get("/_next/*", (req, res) => {
		handle(req.req, res.res)
	})
	next()
}