jest.unmock("../../../../../server/api/v1/server/create")
jest.unmock("../../../../../server/mongo")

const MongoClient = require("mongodb").MongoClient
import mongo from "../../../../../server/mongo"
import create from "../../../../../server/api/v1/server/create"

describe("Create a server", () => {
	let db
	beforeEach(async () => {
		const client = await MongoClient.connect(mongo.url)
		db = client.db(mongo.database.test)
	})
	afterEach(async () => {
		const collection = db.collection("servers")
		await collection.deleteMany({})
	})
	test(`database should be test`, () => {
		expect(db.s.databaseName).toBe(mongo.database.test)
	})
	test("Should throw an exception", () => {
		const params = {}
		expect(create(db, params)).rejects.toThrow()
	})
	test("Should throw an exception", () => {
		const params = {
			"name": "beluga is awesome"
		}
		expect(create(db, params)).rejects.toThrow()
	})
	test("Should throw an exception", () => {
		const params = {
			"text": 0
		}
		expect(create(db, params)).rejects.toThrow()
	})
	test("Should not throw an exception", () => {
		const params = {
			"name": "test",
			"user_id": "000000000000000000000000",
			"display_name": "test"
		}
		expect(create(db, params)).resolves.toBeInstanceOf(Object)
	})
})