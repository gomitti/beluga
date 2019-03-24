import mongo from "./mongo"
const MongoClient = require("mongodb").MongoClient

const main = async () => {
    try {
        const client = await MongoClient.connect(mongo.url)
        const db = client.db(mongo.database.production)

        // インデックスを張る
        db.collection("statuses").createIndex({ "user_id": -1, "_id": -1 })

        db.collection("channel_timeline").createIndex({ "belongs_to": -1 })
        db.collection("channel_timeline").createIndex({ "user_id": -1 })
        db.collection("channel_timeline").createIndex({ "user_id": -1, "belongs_to": -1 })
        db.collection("channel_timeline").createIndex({ "status_id": -1, "belongs_to": -1 }, { "unique": true })

        db.collection("thread_timeline").createIndex({ "belongs_to": -1 })
        db.collection("thread_timeline").createIndex({ "user_id": -1 })
        db.collection("thread_timeline").createIndex({ "user_id": -1, "belongs_to": -1 })
        db.collection("thread_timeline").createIndex({ "status_id": -1, "belongs_to": -1 }, { "unique": true })

        db.collection("message_timeline").createIndex({ "belongs_to": -1 })
        db.collection("message_timeline").createIndex({ "user_id": -1 })
        db.collection("message_timeline").createIndex({ "user_id": -1, "belongs_to": -1 })
        db.collection("message_timeline").createIndex({ "status_id": -1, "belongs_to": -1 }, { "unique": true })

        db.collection("muted_users").createIndex({ "user_id_to_mute": -1, "requested_by": -1 }, { "unique": true })
        db.collection("muted_words").createIndex({ "user_id": -1 }, { "unique": true })

        db.collection("likes").createIndex({ "status_id": -1, "user_id": -1 }, { "unique": true })
        db.collection("likes").createIndex({ "status_author_id": -1 })

        db.collection("favorites").createIndex({ "status_id": -1, "user_id": -1 }, { "unique": true })
        db.collection("favorites").createIndex({ "user_id": -1 })
        db.collection("favorites").createIndex({ "status_author_id": -1 })
        db.collection("favorites").createIndex({ "status_id": -1 })

        db.collection("reactions").createIndex({ "status_id": -1, "user_id": -1, "shortname": -1 }, { "unique": true })
        db.collection("reactions").createIndex({ "status_id": -1 })

        db.collection("media").createIndex({ "is_image": -1 })
        db.collection("media").createIndex({ "is_video": -1 })

        db.collection("sessions").createIndex({ "encrypted_id": -1 }, { "unique": true })
        db.collection("channels").createIndex({ "community_id": -1, "name": -1 }, { "unique": true })

        db.collection("community_members").createIndex({ "community_id": -1 })
        db.collection("community_members").createIndex({ "user_id": -1 })

        db.collection("channel_members").createIndex({ "channel_id": -1 })
        db.collection("channel_members").createIndex({ "community_id": -1 })
        db.collection("channel_members").createIndex({ "community_id": -1, "user_id": -1 })
        db.collection("channel_members").createIndex({ "channel_id": -1, "user_id": -1 }, { "unique": true })

        db.collection("access_tokens").createIndex({ "user_id": -1 }, { "unique": true })
        db.collection("user_role").createIndex({ "community_id": -1, "user_id": -1 }, { "unique": true })
        db.collection("kvs").createIndex({ "user_id": -1 })
        db.collection("channel_permissions").createIndex({ "channel_id": -1 })
        db.collection("channel_permissions").createIndex({ "channel_id": -1, "role": -1 }, { "unique": true })

        db.collection("emojis").createIndex({ "community_id": -1 })
        db.collection("emojis").createIndex({ "added_by": -1 })
        db.collection("emojis").createIndex({ "community_id": -1, "added_by": -1 })
        db.collection("emojis").createIndex({ "community_id": -1, "shortname": -1 }, { "unique": true })

        client.close()
    } catch (error) {
        console.log(error)
    }

}

main()