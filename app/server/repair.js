import mongo from "./mongo"
import constants from "./constants"
const MongoClient = require("mongodb").MongoClient

const main = async () => {
    try {
        const client = await MongoClient.connect(mongo.url)
        const db = client.db(mongo.database.production)

        // チャンネルタイムライン
        if (false) {
            const docs = await db.collection("statuses")
                .find({ "channel_id": { "$exists": true } }).toArray()
            for (let j = 0; j < docs.length; j++) {
                const doc = docs[j]
                try {
                    await db.collection("channel_timeline").insertOne({
                        "status_id": doc._id,
                        "user_id": doc.user_id,
                        "belongs_to": doc.channel_id
                    })
                } catch (error) {
                    // console.log(error)
                }
            }
        }

        // コミュニティタイムライン
        if (false) {
            const docs = await db.collection("statuses")
                .find({ "community_id": { "$exists": true } }).toArray()
            for (let j = 0; j < docs.length; j++) {
                const doc = docs[j]
                try {
                    await db.collection("community_timeline").insertOne({
                        "status_id": doc._id,
                        "user_id": doc.user_id,
                        "belongs_to": doc.community_id
                    })
                } catch (error) {
                    // console.log(error)
                }
            }
        }

        // スレッドタイムライン
        if (false) {
            const docs = await db.collection("statuses")
                .find({ "in_reply_to_status_id": { "$exists": true } }).toArray()
            for (let j = 0; j < docs.length; j++) {
                const doc = docs[j]
                try {
                    const in_reply_to_status = await db.collection("statuses").findOne({ "_id": doc.in_reply_to_status_id })
                    if (in_reply_to_status) {
                        await db.collection("thread_timeline").insertOne({
                            "status_id": doc._id,
                            "user_id": doc.user_id,
                            "belongs_to": doc.in_reply_to_status_id
                        })
                        await db.collection("thread_timeline").insertOne({
                            "status_id": in_reply_to_status._id,
                            "user_id": in_reply_to_status.user_id,
                            "belongs_to": in_reply_to_status._id
                        })
                    }
                } catch (error) {
                    // console.log(error)
                }
            }
        }

        // メッセージタイムライン
        if (false) {
            const docs = await db.collection("statuses")
                .find({ "recipient_id": { "$exists": true } }).toArray()
            for (let j = 0; j < docs.length; j++) {
                const doc = docs[j]
                try {
                    await db.collection("message_timeline").insertOne({
                        "status_id": doc._id,
                        "user_id": doc.user_id,
                        "belongs_to": doc.recipient_id
                    })
                } catch (error) {
                    // console.log(error)
                }
            }
        }

        // チャンネルの参加者数
        if (true) {
            const docs = await db.collection("channels").find().toArray()
            for (let j = 0; j < docs.length; j++) {
                const doc = docs[j]
                const channel_id = doc._id
                try {
                    const members_count = await db.collection("channel_members").find({ channel_id }).count()
                    const ret = await db.collection("channels").updateOne(
                        { "_id": channel_id },
                        { "$set": { members_count } })
                } catch (error) {
                    console.log(error)
                }
            }
        }


        // コミュニティ管理者
        if (true) {
            const docs = await db.collection("communities").find().toArray()
            for (let j = 0; j < docs.length; j++) {
                const doc = docs[j]
                const community_id = doc._id
                const user_id = doc.created_by
                try {
                    const ret = await db.collection("user_role").updateOne(
                        { user_id, community_id },
                        { "$set": { "role": constants.role.admin } },
                        { "upsert": true })
                } catch (error) {
                    console.log(error)
                }
            }
        }

        client.close()
    } catch (error) {
        console.log(error)
    }

}
main()