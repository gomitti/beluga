import { sha256 } from "js-sha256"
import api from "../api"
import memcached from "../memcached"
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
    fastify.setNotFoundHandler((request, reply) => {
        reply.code(404).send("このURLは存在しません。トップページに戻ってください。")
    })
    fastify.decorate("csrf_token", async (req, res, session) => {
        if (!!session === false) {
            session = await fastify.session.start(req, res)
        }
        return sha256(session.id)
    })
    fastify.decorate("logged_in_user", async (req, res, session) => {
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
        let ua = req.headers["user-agent"];
        if (ua.match(/mobile/i)) {
            return "mobile"
        }
        return "desktop"
    })
    fastify.decorate("build_columns", async (stored_columns, initial_column, logged_in_user, request_query, source_community) => {
        if (stored_columns.length == 0) {
            stored_columns.push(initial_column)
        }
        const columns = []
        for (let column_index = 0; column_index < stored_columns.length; column_index++) {
            const column = stored_columns[column_index]
            if (column_index === 0) {
                const timeline_query = {}
                if (request_query.since_id) {
                    timeline_query.since_id = request_query.since_id
                }
                if (request_query.max_id) {
                    timeline_query.max_id = request_query.max_id
                }
                if (request_query.count) {
                    timeline_query.count = parseInt(request_query.count)
                }
                column.timeline_query = timeline_query
            }
            const { type, param_ids, timeline_query } = column
            const query = assign({
                "trim_user": false,
                "trim_community": false,
                "trim_channel": false,
                "trim_favorited_by": false,
                "trim_recipient": false,
                "requested_by": logged_in_user.id
            }, timeline_query)

            const { community_id, user_id, channel_id, in_reply_to_status_id } = param_ids

            if (type === "community") {
                if (!!community_id === false) {
                    continue
                }
                const community = await model.v1.community.show(fastify.mongo.db, {
                    "id": community_id
                })
                if (community === null) {
                    continue
                }
                const statuses = await timeline.v1.community(fastify.mongo.db, assign(query, {
                    "community_id": community_id,
                    "count": 60
                }))
                column.statuses = statuses
                column.params = { community }
            }
            if (type === "channel") {
                if (!!channel_id === false) {
                    continue
                }
                const channel = await model.v1.channel.show(fastify.mongo.db, {
                    "id": channel_id,
                    "requested_by": logged_in_user.id
                })
                if (channel === null) {
                    continue
                }
                const statuses = await timeline.v1.channel(fastify.mongo.db, assign(query, {
                    "channel_id": channel_id
                }))
                column.statuses = statuses
                column.params = { channel }
            }
            if (type === "message") {
                if (!!user_id === false) {
                    continue
                }
                const user = await model.v1.user.show(fastify.mongo.db, {
                    "id": user_id
                })
                if (user === null) {
                    continue
                }
                if (!!community_id === false) {
                    continue
                }
                const community = await model.v1.community.show(fastify.mongo.db, {
                    "id": community_id
                })
                if (community === null) {
                    continue
                }
                const statuses = await timeline.v1.message(fastify.mongo.db, assign(query, {
                    "user_id": user_id,
                    "community_id": community_id
                }))
                column.statuses = statuses
                column.params = { community, user }
            }
            if (type === "thread") {
                if (!!in_reply_to_status_id === false) {
                    continue
                }
                const in_reply_to_status = await collection.v1.status.show(fastify.mongo.db, {
                    "id": in_reply_to_status_id,
                    "trim_user": false,
                    "trim_community": false,
                    "trim_channel": false,
                    "trim_recipient": false,
                    "trim_favorited_by": false,
                    "trim_commenters": false,
                    "requested_by": logged_in_user.id
                })
                if (in_reply_to_status === null) {
                    continue
                }
                const statuses = await timeline.v1.thread(fastify.mongo.db, assign(query, {
                    "in_reply_to_status_id": in_reply_to_status_id,
                }))
                column.statuses = statuses
                column.params = { in_reply_to_status }
            }
            if (type === "notifications") {
                const statuses = await timeline.v1.notifications(fastify.mongo.db, assign(query, {
                    "user_id": logged_in_user.id,
                    "community_id": community_id
                }))
                column.statuses = statuses
                column.params = {
                    "community": source_community
                }
            }
            columns.push(column)
        }
        return columns
    })
    fastify.decorate("generate_pagination_flags", async (count_func, count_query, request_query) => {
        let has_newer_statuses = false
        let has_older_statuses = false
        let needs_redirect = false
        const expected_count = request_query.count ? parseInt(request_query.count) : config.timeline.default_count
        if (request_query.since_id) {
            const count = await count_func(fastify.mongo.db, assign(count_query, {
                "since_id": request_query.since_id
            }))
            if (count < expected_count) {
                needs_redirect = true
            }
            has_newer_statuses = true
            has_older_statuses = true
        } else {
            if (request_query.max_id) {
                const count = await count_func(fastify.mongo.db, assign(count_query, {
                    "max_id": request_query.max_id
                }))
                if (count > expected_count) {
                    has_older_statuses = true
                }
                has_newer_statuses = true
            } else {
                const count = await count_func(fastify.mongo.db, count_query)
                if (count > expected_count) {
                    has_older_statuses = true
                }
            }
        }
        return { has_newer_statuses, has_older_statuses, needs_redirect }
    })
    // オンラインのユーザーを取得
    fastify.decorate("online_members", async (community, logged_in_user) => {
        const online_user_ids = fastify.websocket_bridge.get_users_by_community(community)
        const member = []
        let including_me = false
        for (let j = 0; j < online_user_ids.length; j++) {
            const user_id = online_user_ids[j]
            const user = await model.v1.user.show(fastify.mongo.db, { "id": user_id })
            if (user) {
                member.push(user)
                if (logged_in_user && user.id.equals(logged_in_user.id)) {
                    including_me = true
                }
            }
        }
        if (logged_in_user && including_me === false) {
            member.push(logged_in_user)
        }
        return member
    })
    fastify.decorate("restore_columns", async (user_id, pathname) => {
        pathname = pathname.replace(/[#?].+$/, "")
        const stored_columns = await memcached.v1.kvs.restore(fastify.mongo.db, {
            "user_id": user_id,
            "key": `client.default.columns.${pathname}`
        })
        if (stored_columns === null) {
            return []
        }
        assert(is_array(stored_columns), "$stored_columns must be of type array")
        return stored_columns
    })
    fastify
        .register(require("./client/account"))
        .register(require("./client/channel"))
        .register(require("./client/user"))
        .register(require("./client/settings"))
        .register(require("./client/status"))
        .register(require("./client/community"))

    fastify.next("/", async (app, req, res) => {
        try {
            const logged_in_user = await fastify.logged_in_user(req, res)
            const db = fastify.mongo.db
            const rows = await db.collection("channels").find({}).toArray()
            const channels = []
            for (let j = 0; j < rows.length; j++) {
                const channel = rows[j]
                const community = await model.v1.community.show(db, { "id": channel.community_id })
                if (!community) {
                    continue
                }
                channel.community = community
                channels.push(channel)
            }
            const device = fastify.device(req)
            app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/entrance`, { channels, logged_in_user })
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
    // fastify.next("/sprite", async (app, req, res) => {
    //     app.render(req.req, res.res, `/common/sprite`)
    // })
    // fastify.next("/emoji", async (app, req, res) => {
    //     app.render(req.req, res.res, `/common/emoji`)
    // })
    //     fastify.get("/embed/tweet/:user_name/:status_id", (req, res) => {
    //         const user_name = req.params.user_name
    //         const status_id = req.params.status_id

    //         if (!user_name.match(/^[a-zA-Z0-9_]+$/)) {
    //             return fastify.error(app, req, res, 404)
    //         }
    //         if (!status_id.match(/^[0-9]+$/)) {
    //             return fastify.error(app, req, res, 404)
    //         }
    //         const href = `https://twitter.com/${user_name}/status/${status_id}`
    //         const html = `
    // <html>
    //     <head>
    //         <meta charSet="utf-8" />
    //         <link type="text/css" rel="stylesheet" href="https://platform.twitter.com/css/tweet.ab9101be6980fafdba47e88fa54bd311.light.ltr.css" />
    //     </head>
    //     <body style="width:100%;">
    //         <blockquote class="twitter-tweet" data-lang="ja">
    //             <p lang="ja" dir="ltr"><a href=${href}></a></p>
    //             <a href=${href}></a>
    //         </blockquote>
    //         <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
    //     </body>
    // </html>
    //         `
    //         res
    //             .code(200)
    //             .header("Content-Type", "text/html")
    //             .send(html)
    //     })
    next()
}