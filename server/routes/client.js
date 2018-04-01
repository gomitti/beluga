import { sha256 } from "js-sha256"
import model from "../model"
import config from "../config/beluga"
const next = require("next")
const dev = process.env.NODE_ENV !== "production"
const handle = next({ dev }).getRequestHandler()

module.exports = (fastify, options, next) => {
    fastify.decorate("error", (app, req, res, code) => {
        res.res.statusCode = code;
        return app.render(req.req, res.res, "/_error", { code })
    })
    fastify.decorate("csrf_token", async (req, res, session) => {
        if (!!session === false) {
            session = await fastify.session.start(req, res)
        }
        return sha256(session.id)
    })
    fastify.decorate("logged_in", async (req, res, session) => {
        if (!!session === false) {
            session = await fastify.session.start(req, res)
        }
        if (!!session.user_id === false) {
            return null
        }
        try {
            return await model.v1.user.show(fastify.mongo.db, { "id": session.user_id, "trim_profile": false })
        } catch (error) {
            return null
        }
    })
    fastify.decorate("theme", req => {
        const ua = req.headers["user-agent"];
        if (ua.match(/mobile/i)) {
            return "default"
        }
        return "default"
    })
    fastify.decorate("platform", req => {
        const ua = req.headers["user-agent"];
        if (ua.match(/mac/i)) {
            return "mac"
        }
        return "win"
    })
    fastify.decorate("device", req => {
        var ua = req.headers["user-agent"];
        if (ua.match(/mobile/i)) {
            return "mobile"
        }
        return "desktop"
    })
    fastify
        .register(require("./client/account"))
        .register(require("./client/server"))
        .register(require("./client/hashtag"))
        .register(require("./client/settings"))

    fastify.next("/", async (app, req, res) => {
        try {
            const logged_in = await fastify.logged_in(req, res)
            const db = fastify.mongo.db
            const collection = db.collection("hashtags")
            const rows = await collection.find({}).toArray()
            const hashtags = []
            for (const hashtag of rows) {
                const server = await model.v1.server.show(db, { "id": hashtag.server_id })
                if (!server) {
                    continue
                }
                hashtag.server = server
                hashtags.push(hashtag)
            }
            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/entrance`, { hashtags, logged_in })
        } catch (error) {
            console.log(error)
            return fastify.error(app, req, res, 500)
        }
    })
    fastify.next("/colors", async (app, req, res) => {
        app.render(req.req, res.res, `/common/colors`, { "colors": config.colors })
    })
    fastify.next("/gradients", async (app, req, res) => {
        app.render(req.req, res.res, `/common/gradients`, { "gradients": config.gradients })
    })
    fastify.get("/embed/tweet/:user_name/:status_id", (req, res) => {
        const user_name = req.params.user_name
        const status_id = req.params.status_id

        if (!user_name.match(/^[a-zA-Z0-9_]+$/)) {
            return fastify.error(app, req, res, 404)
        }
        if (!status_id.match(/^[0-9]+$/)) {
            return fastify.error(app, req, res, 404)
        }
        const href = `https://twitter.com/${user_name}/status/${status_id}`
        const html = `
<html>
    <head></head>
    <body>
        <div>
            <Head>
                <meta charSet="utf-8" />
                <link type="text/css" rel="stylesheet" href="https://platform.twitter.com/css/tweet.ab9101be6980fafdba47e88fa54bd311.light.ltr.css" />
            </Head>
            <blockquote class="twitter-tweet" data-lang="ja">
                <p lang="ja" dir="ltr"><a href=${href}></a></p>
                <a href=${href}></a>
            </blockquote>
            <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
        </div>
    </body>
</html>
        `
        res
            .code(200)
            .header("Content-Type", "text/html")
            .send(html)
    })

    // Nextは.jsを動的に生成するため、最初の1回はここで生成する
    // 2回目以降はNginxのproxy_cacheが効くのでここは呼ばれない
    fastify.get("/_next/*", (req, res) => {
        handle(req.req, res.res)
    })
    next()
}