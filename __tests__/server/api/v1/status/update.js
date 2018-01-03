jest.unmock("../../../../../server/api/v1/status/update")
jest.unmock("../../../../../server/mongo")

const MongoClient = require("mongodb").MongoClient
import * as mongo from "../../../../../server/mongo"
import update from "../../../../../server/api/v1/status/update"

describe("Update", () => {
	let db
	beforeEach(async () => {
		const client = await MongoClient.connect(mongo.url)
		db = client.db(mongo.test_name)
	})
	afterEach(async () => {
		const collection = db.collection("statuses")
		collection.deleteMany({})
	})
	test(`database should be test`, async () => {
		expect(db.s.databaseName).toBe(mongo.test_name)
	})
	test("Should throws an exception", async () => {
		const params = {}
		expect(update(db, params)).rejects.toThrow()
	})
	test("Should throws an exception", async () => {
		const params = {
			"text": "beluga is awesome"
		}
		expect(update(db, params)).rejects.toThrow()
	})
	test("Should throws an exception", async () => {
		const params = {
			"text": 0
		}
		expect(update(db, params)).rejects.toThrow()
	})
})