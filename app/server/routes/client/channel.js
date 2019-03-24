import constants from "../../constants"
import memcached from "../../memcached"
import model from "../../model"

module.exports = (fastify, options, next) => {
    fastify.next("/:community_name/:channel_name/settings/profile", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in_user = await fastify.logged_in_user(req, res, session)
        if (logged_in_user === null) {
            return fastify.error(app, req, res, 404)
        }

        const { community_name, channel_name } = req.params
        const community = await memcached.v1.community.show(fastify.mongo.db, { "name": community_name })
        if (community === null) {
            return fastify.error(app, req, res, 404)
        }
        const channel = await memcached.v1.channel.show(fastify.mongo.db, {
            "name": channel_name, "community_id": community.id
        })
        if (channel === null) {
            return fastify.error(app, req, res, 404)
        }
        if (channel.created_by.equals(logged_in_user.id) === false) {
            return fastify.error(app, req, res, 404)
        }

        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/channel/settings/profile`, {
            csrf_token, community, channel, logged_in_user,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/:community_name/:channel_name/settings/access_control", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in_user = await fastify.logged_in_user(req, res, session)
        if (logged_in_user === null) {
            return fastify.error(app, req, res, 404)
        }

        const { community_name, channel_name } = req.params
        const community = await memcached.v1.community.show(fastify.mongo.db, { "name": community_name })
        if (community === null) {
            return fastify.error(app, req, res, 404)
        }
        const channel = await memcached.v1.channel.show(fastify.mongo.db, {
            "name": channel_name, "community_id": community.id
        })
        if (channel === null) {
            return fastify.error(app, req, res, 404)
        }
        if (channel.created_by.equals(logged_in_user.id) === false) {
            return fastify.error(app, req, res, 404)
        }

        const members_in_channel = await model.v1.channel.members(fastify.mongo.db, { "channel_id": channel.id })
        const members_in_community = await model.v1.community.members(fastify.mongo.db, { "community_id": channel.community_id })

        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/channel/settings/access_control`, {
            csrf_token, community, channel, logged_in_user, members_in_channel, members_in_community,
            "platform": fastify.platform(req),
        })
    })
    fastify.next("/:community_name/:channel_name/settings/permissions", async (app, req, res) => {
        const session = await fastify.session.start(req, res)
        const csrf_token = await fastify.csrf_token(req, res, session)
        const logged_in_user = await fastify.logged_in_user(req, res, session)
        if (logged_in_user === null) {
            return fastify.error(app, req, res, 404)
        }

        const { community_name, channel_name } = req.params
        const community = await memcached.v1.community.show(fastify.mongo.db, { "name": community_name })
        if (community === null) {
            return fastify.error(app, req, res, 404)
        }
        const channel = await memcached.v1.channel.show(fastify.mongo.db, {
            "name": channel_name, "community_id": community.id
        })
        if (channel === null) {
            return fastify.error(app, req, res, 404)
        }
        if (channel.created_by.equals(logged_in_user.id) === false) {
            return fastify.error(app, req, res, 404)
        }

        const map_role_number = {
            "admin": constants.role.admin,
            "moderator": constants.role.moderator,
            "member": constants.role.member,
            "guest": constants.role.guest,
        }
        const permissions = await memcached.v1.channel.permissions.get(fastify.mongo.db, {
            "channel_id": channel.id
        })

        app.render(req.req, res.res, `/theme/${fastify.theme(req)}/${fastify.device(req)}/channel/settings/permissions`, {
            csrf_token, community, channel, logged_in_user, map_role_number, permissions,
            "platform": fastify.platform(req),
        })
    })
    next()
}