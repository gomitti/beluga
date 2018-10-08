import { sha256 } from "js-sha256"
import model from "../model"
import collection from "../collection"
import timeline from "../timeline"
import config from "../config/beluga"
import assign from "../lib/assign"

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
        if (session.user_id === null) {
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
    fastify.decorate("build_columns", async (stored_columns, logged_in, source_server, source_hashtag, source_recipient, source_in_reply_to_status) => {
        const columns = []
        for (let i = 0; i < stored_columns.length; i++) {
            const column = stored_columns[i]
            const { type, param_ids } = column
            const params = {
                "trim_user": false,
                "trim_server": false,
                "trim_hashtag": false,
                "trim_favorited_by": false,
                "trim_recipient": false,
                "requested_by": logged_in.id
            }

            if (type === "server") {
                if (!!param_ids.server_id === false) {
                    continue
                }
                const server = await model.v1.server.show(fastify.mongo.db, {
                    "id": param_ids.server_id
                })
                if (server === null) {
                    continue
                }
                const statuses = await timeline.v1.server(fastify.mongo.db, assign(params, {
                    "server_id": param_ids.server_id
                }))
                column.statuses = statuses
                column.params = { server }
            }
            if (type === "hashtag") {
                if (!!param_ids.hashtag_id === false) {
                    continue
                }
                const hashtag = await model.v1.hashtag.show(fastify.mongo.db, {
                    "id": param_ids.hashtag_id,
                    "requested_by": logged_in.id
                })
                if (hashtag === null) {
                    continue
                }
                const statuses = await timeline.v1.hashtag(fastify.mongo.db, assign(params, {
                    "hashtag_id": param_ids.hashtag_id
                }))
                column.statuses = statuses
                column.params = { hashtag }
            }
            if (type === "home") {
                if (!!param_ids.user_id === false) {
                    continue
                }
                const user = await model.v1.user.show(fastify.mongo.db, {
                    "id": param_ids.user_id
                })
                if (user === null) {
                    continue
                }
                if (!!param_ids.server_id === false) {
                    continue
                }
                const server = await model.v1.server.show(fastify.mongo.db, {
                    "id": param_ids.server_id
                })
                if (server === null) {
                    continue
                }
                const statuses = await timeline.v1.home(fastify.mongo.db, assign(params, {
                    "user_id": param_ids.user_id,
                    "server_id": param_ids.server_id
                }))
                column.statuses = statuses
                column.params = { server, user }
            }
            if (type === "thread") {
                if (!!param_ids.in_reply_to_status_id === false) {
                    continue
                }
                const in_reply_to_status = await collection.v1.status.show(fastify.mongo.db, {
                    "id": param_ids.in_reply_to_status_id,
                    "trim_user": false,
                    "trim_server": false,
                    "trim_hashtag": false,
                    "trim_recipient": false,
                    "trim_favorited_by": false,
                    "trim_commenters": false,
                    "requested_by": logged_in.id
                })
                if (in_reply_to_status === null) {
                    continue
                }
                const statuses = await timeline.v1.thread(fastify.mongo.db, assign(params, {
                    "in_reply_to_status_id": param_ids.in_reply_to_status_id,
                }))
                column.statuses = statuses
                column.params = { in_reply_to_status }
            }
            if (type === "notifications") {
                const statuses = await timeline.v1.notifications(fastify.mongo.db, assign(params, {
                    "user_id": logged_in.id,
                    "server_id": param_ids.server_id
                }))
                column.statuses = statuses
                column.params = {
                    "server": source_server
                }
            }
            columns.push(column)
        }
        return columns
    })
    fastify
        .register(require("./client/account"))
        .register(require("./client/server"))
        .register(require("./client/hashtag"))
        .register(require("./client/settings"))
        .register(require("./client/customize"))

    fastify.next("/", async (app, req, res) => {
        try {
            const logged_in = await fastify.logged_in(req, res)
            const db = fastify.mongo.db
            const rows = await db.collection("hashtags").find({}).toArray()
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
    next()
}