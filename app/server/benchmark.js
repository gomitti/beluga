import "babel-polyfill"
import { ObjectID } from "mongodb"
import mongo from "./mongo"
import api from "./api"
import storage from "./config/storage"
import { hash } from "bcrypt/bcrypt"

const MongoClient = require("mongodb").MongoClient

const signup = async (db) => {
    const params = {
        "name": "test",
        "ip_address": "",
        "raw_password": "password"
    }
    const user = await api.v1.account.signup(db, params)
    user.id = user._id
    delete user._id
    return user
}

const create_server = async (db, user) => {
    const params = {
        "name": "test",
        "display_name": "test",
        "user_id": user.id
    }
    return api.v1.server.create(db, params)
}

const create_channel = async (db, user, server) => {
    const params = {
        "name": "test",
        "user_id": user.id,
        "server_id": server.id
    }
    return api.v1.channel.create(db, params)
}

const insert_statuses = async (db, user, channel, server) => {
    const params = {
        "text": "あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。",
        "user_id": user.id,
    }
    for (let i = 0; i < 500000; i++) {
        await api.v1.status.update(db, Object.assign({ "channel_id": channel.id }, params))
        await api.v1.status.update(db, Object.assign({ "channel_id": ObjectID.createFromTime(Date.now()) }, params))
    }
    for (let k = 0; k < 100; k++) {
        await api.v1.status.update(db, Object.assign({
            "recipient_id": user.id,
            "server_id": server.id,
        }, params))
        for (let i = 0; i < 10000; i++) {
            await api.v1.status.update(db, Object.assign({
                "recipient_id": ObjectID.createFromTime(Date.now()),
                "server_id": ObjectID.createFromTime(Date.now()),
            }, params))
        }
    }
}

(async () => {
    try {
        const client = await MongoClient.connect(mongo.url)

        if (true) {
            const db = client.db(mongo.database.production)
            if (true) {
                const collection = db.collection("users")
                const users = await collection.find({}).toArray()
                for (let j = 0; j < users.length; j++) {
                    const user = users[j]
                    await db.collection("password").insertOne({
                        "user_id": user._id,
                        "password_hash": user._password_hash
                    })
                }
            }
            return
        }












        const db = client.db(mongo.database.test)
        console.log(mongo.database.test)

        // db.collection("users").deleteMany({})
        // db.collection("servers").deleteMany({})
        // db.collection("channels").deleteMany({})

        // const user = await signup(db)
        // console.log(user)
        // const server = await create_server(db, user)
        // console.log(server)
        // const channel = await create_channel(db, user, server)
        // console.log(channel)

        // await insert_statuses(db, user, channel, server)
        // console.log("done")




        const user = (await db.collection("users").find({}).toArray())[0]
        const channel = (await db.collection("channels").find({}).toArray())[0]
        const server = (await db.collection("servers").find({}).toArray())[0]
        user.id = user._id
        channel.id = channel._id
        server.id = server._id
        console.log(user)
        console.log(channel)
        console.log(server)



        // db.collection("statuses").createIndex({ "channel_id": -1, "_id": -1 })
        // db.collection("statuses").createIndex({ "recipient_id": -1, "server_id": -1, "_id": -1 })

        // db.collection("statuses").dropIndex({ "recipient_id": -1, "server_id": -1, "_id": -1 })
        // db.collection("statuses").dropIndex({ "channel_id": -1, "_id": -1 })

        console.time("channel");
        await api.v1.timeline.channel(db, {
            "id": channel.id,
            "trim_user": true,
            "max_id": "5a5599476daefccff4cc5292",
            "sort": -1,
            "count": 30
        })
        console.timeEnd("channel");
        console.time("home");
        await api.v1.timeline.home(db, {
            "user_id": user.id,
            "server_id": server.id,
            "trim_user": true,
            "max_id": "5a5599476daefccff4cc5292",
            "sort": -1,
            "count": 30
        })
        console.timeEnd("home");

        client.close()
    } catch (error) {
        console.log(error)
    }
})()