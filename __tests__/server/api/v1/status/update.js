jest.unmock("../../../../../server/api/v1/status/update")
jest.unmock("../../../../../server/mongo")

const MongoClient = require("mongodb").MongoClient
import mongo from "../../../../../server/mongo"
import update from "../../../../../server/api/v1/status/update"

describe("Update", () => {
	let db
	beforeEach(async () => {
		const client = await MongoClient.connect(mongo.url)
		db = client.db(mongo.database.test)
	})
	afterEach(async () => {
		const collection = db.collection("statuses")
		await collection.deleteMany({})
	})
	test(`database should be test`, () => {
		expect(db.s.databaseName).toBe(mongo.database.test)
	})
	test("Should throw an exception", () => {
		const params = {}
		expect(update(db, params)).rejects.toThrow()
	})
	test("Should throw an exception", () => {
		const params = {
			"text": "beluga is awesome"
		}
		expect(update(db, params)).rejects.toThrow()
	})
	test("Should throw an exception", () => {
		const params = {
			"text": 0
		}
		expect(update(db, params)).rejects.toThrow()
	})
	test("Should throw an exception", () => {
		const params = {
			"text": "beluga is awesome",
			"user_id": "000000000000000000000000"
		}
		expect(update(db, params)).rejects.toThrow()
	})
	test("Should throw an exception", () => {
		const params = {
			"text": "beluga is awesome",
			"hashtag_id": "000000000000000000000000"
		}
		expect(update(db, params)).rejects.toThrow()
	})
	test("Should throw an exception", () => {
		const params = {
			"text": "beluga is awesome",
			"recipient_id": "000000000000000000000000"
		}
		expect(update(db, params)).rejects.toThrow()
	})
	test("Should not throw an exception", () => {
		const params = {
			"text": "beluga is awesome",
			"user_id": "000000000000000000000000",
			"hashtag_id": "000000000000000000000000"
		}
		expect(update(db, params)).resolves.toBeInstanceOf(Object)
	})
	test("Should not throw an exception", () => {
		const params = {
			"text": "beluga is awesome",
			"user_id": "000000000000000000000000",
			"recipient_id": "000000000000000000000000"
		}
		expect(update(db, params)).resolves.toBeInstanceOf(Object)
	})
	test("Should throw an exception", () => {
		const params = {
			"text": "beluga is awesome",
			"user_id": "000000000000000000000000",
			"hashtag_id": "000000000000000000000000",
			"recipient_id": "000000000000000000000000"
		}
		expect(update(db, params)).rejects.toThrow()
	})
	test("Should throw an exception", () => {
		const params = {
			"user_id": "000000000000000000000000",
			"hashtag_id": "000000000000000000000000",
			"recipient_id": "000000000000000000000000"
		}
		expect(update(db, params)).rejects.toThrow()
	})
	test("Should throw an exception", () => {
		const params = {
			"hashtag_id": "000000000000000000000000",
			"recipient_id": "000000000000000000000000"
		}
		expect(update(db, params)).rejects.toThrow()
	})
	test("Should throw an exception", () => {
		const params = {
			"text": "",
			"user_id": "000000000000000000000000",
			"hashtag_id": "000000000000000000000000",
		}
		expect(update(db, params)).rejects.toThrow()
	})
	test("Should throw an exception", () => {
		const params = {
			"text": "",
			"user_id": "000000000000000000000000",
			"recipient_id": "000000000000000000000000",
		}
		expect(update(db, params)).rejects.toThrow()
	})
})