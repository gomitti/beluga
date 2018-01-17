jest.unmock("../../../../../server/api/v1/timeline/home")
jest.unmock("../../../../../server/mongo")

const MongoClient = require("mongodb").MongoClient
import mongo from "../../../../../server/mongo"
import fetch from "../../../../../server/api/v1/timeline/hashtag"
import update from "../../../../../server/api/v1/status/update"

describe("Fetch hashtag timeline", () => {
	let db
	let statuses = []
	beforeAll(async () => {
		const client = await MongoClient.connect(mongo.url)
		db = client.db(mongo.database.test)
		const params = {
			"user_id": "000000000000000000000000",
			"hashtag_id": "000000000000000000000000",
		}
		for(let i = 0;i < 100;i++){
			params.text = `#${i}`
			const status = await update(db, params)
			statuses.push(status)
		}
	})
	afterAll(async () => {
		const collection = db.collection("statuses")
		await collection.deleteMany({})
	})
	test("database should be test", () => {
		expect(db.s.databaseName).toBe(mongo.database.test)
	})
	test("Should throw an exception", () => {
		const params = {}
		expect(fetch(db, params)).rejects.toThrow()
	})
	test("Should return an array", () => {
		const params = {
			"id": "000000000000000000000000"
		}
		expect(fetch(db, params)).resolves.toBeInstanceOf(Array)
	})
	test("Should throw an exception", () => {
		const params = {
			"hashtag_id": "000000000000000000000000"
		}
		expect(fetch(db, params)).rejects.toThrow()
	})
	test("Should be 35", async () => {
		const params = {
			"id": "000000000000000000000000",
			"count": 35
		}
		const result = await fetch(db, params)
		expect(result).toHaveLength(35)
	})
	test("Should be equal", async () => {
		const count = 35
		const start = 10
		const params = {
			"id": "000000000000000000000000",
			"count": count,
			"since_id": statuses[start].id,
			"sort": -1
		}
		const result = await fetch(db, params)
		expect(result).toHaveLength(count)
		for (let i = 0; i < count; i++) {
			expect(statuses[statuses.length - i - 1]).toEqual(result[i])
		}
	})
	test("Should be equal", async () => {
		const count = 35
		const start = 10
		const params = {
			"id": "000000000000000000000000",
			"count": count,
			"since_id": statuses[start].id,
			"sort": 1
		}
		const result = await fetch(db, params)
		expect(result).toHaveLength(count)
		for (let i = 0; i < count; i++) {
			expect(statuses[i + start + 1]).toEqual(result[i])
		}
	})
	test("Should be equal", async () => {
		const count = 35
		const start = 70
		const params = {
			"id": "000000000000000000000000",
			"count": count,
			"max_id": statuses[start].id,
			"sort": -1
		}
		const result = await fetch(db, params)
		expect(result).toHaveLength(count)
		for (let i = 0; i < count; i++) {
			expect(statuses[start - i - 1]).toEqual(result[i])
		}
	})
	test("Should be equal", async () => {
		const count = 35
		const start = 70
		const params = {
			"id": "000000000000000000000000",
			"count": count,
			"max_id": statuses[start].id,
			"sort": 1
		}
		const result = await fetch(db, params)
		expect(result).toHaveLength(count)
		for (let i = 0; i < count; i++) {
			expect(statuses[i]).toEqual(result[i])
		}
	})
})