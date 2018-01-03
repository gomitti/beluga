jest.unmock("../../server/session/session")
jest.unmock("../../server/session/store")
jest.unmock("../../server/mongo")

const uid = require("uid-safe").sync
const MongoClient = require("mongodb").MongoClient
import * as mongo from "../../server/mongo"
import Session from "../../server/session/session"
import Store from "../../server/session/store"

describe("Session", () => {
	let store
	let db
	const max_cache_capacity = 10
	beforeEach(async () => {
		const client = await MongoClient.connect(mongo.url)
		db = client.db(mongo.test_name)
		store = new Store(db, {
			max_cache_capacity
		})
	})
	afterEach(async () => {
		const collection = db.collection("sessions")
		collection.deleteMany({})
	})
	test(`database should be test`, async () => {
		expect(db.s.databaseName).toBe(mongo.test_name)
	})
	test(`max_cache_capacity should be ${max_cache_capacity}`, async () => {
		expect(store.options.max_cache_capacity).toBe(max_cache_capacity)
	})
	test(`Cache size should be ${max_cache_capacity}`, async () => {
		for (let i = 0; i < max_cache_capacity; i++) {
			const session = new Session(uid(12), uid(12), null, 0)
			await store.save(session)
		}
		expect(Object.keys(store.cache).length).toBe(max_cache_capacity)
		const session = new Session(uid(12), uid(12), null, 0)
		await store.save(session)
		expect(Object.keys(store.cache).length).toBe(1)
	})
})