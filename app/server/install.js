import mongo from "./mongo"
const MongoClient = require("mongodb").MongoClient

const main = async () => {
    try {
        const client = await MongoClient.connect(mongo.url)
        const db = client.db(mongo.database.production)

        // インデックスを張る
        db.collection("statuses").createIndex({ "channel_id": -1, "_id": -1 })
        db.collection("statuses").createIndex({ "in_reply_to_status_id": -1, "_id": -1 })
        db.collection("statuses").createIndex({ "server_id": -1, "is_public": -1, "_id": -1 })
        db.collection("statuses").createIndex({ "user_id": -1, "_id": -1 })
        db.collection("statuses").createIndex({ "recipient_id": -1, "server_id": -1, "_id": -1 })
        db.collection("threads").createIndex({ "in_reply_to_status_id": -1 })
        db.collection("threads").createIndex({ "in_reply_to_status_id": -1, "status_id": -1 })
        db.collection("threads").createIndex({ "status_id": -1 }, { "unique": true })
        db.collection("mentions").createIndex({ "recipient_id": -1, "_id": -1 })
        db.collection("mentions").createIndex({ "recipient_id": -1, "server_id": -1, "_id": -1 })
        db.collection("muted_users").createIndex({ "user_id_to_mute": -1, "requested_by": -1 }, { "unique": true })
        db.collection("muted_words").createIndex({ "user_id": -1 }, { "unique": true })
        db.collection("likes").createIndex({ "status_id": -1, "user_id": -1 }, { "unique": true })
        db.collection("likes").createIndex({ "status_author_id": -1 })
        db.collection("favorites").createIndex({ "status_id": -1, "user_id": -1 }, { "unique": true })
        db.collection("favorites").createIndex({ "user_id": -1 })
        db.collection("favorites").createIndex({ "status_author_id": -1 })
        db.collection("favorites").createIndex({ "status_id": -1 })
        db.collection("reactions").createIndex({ "status_id": -1, "user_id": -1, "shortname": -1 }, { "unique": true })
        db.collection("media").createIndex({ "is_image": -1 })
        db.collection("media").createIndex({ "is_video": -1 })
        db.collection("sessions").createIndex({ "encrypted_id": -1 }, { "unique": true })
        db.collection("channels").createIndex({ "server_id": -1, "name": -1 }, { "unique": true })
        db.collection("server_members").createIndex({ "server_id": -1 })
        db.collection("server_members").createIndex({ "user_id": -1 })
        db.collection("channel_members").createIndex({ "channel_id": -1 })
        db.collection("channel_members").createIndex({ "server_id": -1 })
        db.collection("channel_members").createIndex({ "server_id": -1, "user_id": -1 })
        db.collection("channel_members").createIndex({ "channel_id": -1, "user_id": -1 }, { "unique": true })
        db.collection("access_tokens").createIndex({ "user_id": -1 }, { "unique": true })
        db.collection("kvs").createIndex({ "user_id": -1 })
        db.collection("emojis").createIndex({ "server_id": -1 })
        db.collection("emojis").createIndex({ "added_by": -1 })
        db.collection("emojis").createIndex({ "server_id": -1, "added_by": -1 })
        db.collection("emojis").createIndex({ "server_id": -1, "shortname": -1 }, { "unique": true })

        client.close()
    } catch (error) {
        console.log(error)
    }

}

main()