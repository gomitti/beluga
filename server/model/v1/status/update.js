const axios = require("axios")
import config from "../../../config/beluga"
import api from "../../../api"
import memcached from "../../../memcached"
import show from "./show"

const request = axios.create({
	"timeout": config.status.embed.web.timeout * 1000
})

const get_domain_from_url = url => {
	const component = url.split("/")
	if (component.length < 2) {
		return null
	}
	let domain = component[2]
	if (domain.indexOf(".") === -1) {
		return null
	}
	return domain
}

const extract_metadata = async url => {
	let image = null
	let title = null
	let description = null
	let match = null
	const domain = get_domain_from_url(url)

	// 実際にURLを読み込んでタイトルなどを取得
	try {
		const responce = await request.get(url)
		const html = responce.data.replace(/[\n\t\r]/g, "")
		let head = html.match(/<head([^>]+)?>.+?<\/head>/g)
		if (head.length !== 1) {
			throw Error()
		}
		head = head[0]
		const metatags = head.match(/<meta[^>]+>/g)
		const map_property_content = {}
		const map_name_content = {}
		for (const tag of metatags) {
			match = tag.match(/property=['"](.+?)['"]/)
			if (match) {
				const property = match[1]
				match = tag.match(/content=['"](.+?)['"]/)
				if (match) {
					const content = match[1]
					map_property_content[property] = content
				}
			}
			match = tag.match(/name=['"](.+?)['"]/)
			if (match) {
				const name = match[1]
				match = tag.match(/content=['"](.+?)['"]/)
				if (match) {
					const content = match[1]
					map_name_content[name] = content
				}
			}
		}

		if (head.indexOf("og:") !== -1) {
			if ("og:title" in map_property_content) {
				title = map_property_content["og:title"]
			}
			if ("og:description" in map_property_content) {
				description = map_property_content["og:description"]
			}
			if ("og:image" in map_property_content) {
				image = map_property_content["og:image"]
			}
			if ("og:url" in map_property_content) {
				url = map_property_content["og:url"]
				const new_domain = get_domain_from_url(url)
				if (domain !== new_domain) {
					throw Error()
				}
			}
		} else {
			match = head.match(/<title>(.+?)<\/title>/)
			if (match) {
				title = match[1]
			}
			if ("description" in map_name_content) {
				description = map_name_content["description"]
			}
		}
		if (description && description.length > config.status.embed.web.max_description_length) {
			description = description.substring(0, config.status.embed.web.max_description_length + 1)
		}
	} catch (error) {
		image = null
		title = null
		description = null
		match = null
	}
	return { domain, image, title, description, url }
}

export default async (db, params) => {
	const user = await memcached.v1.user.show(db, { "id": params.user_id })
	if (!user) {
		throw new Error("ユーザーが見つかりません")
	}

	let hashtag = null
	if (params.hashtag_id) {
		hashtag = await memcached.v1.hashtag.show(db, { "id": params.hashtag_id })
		if (!hashtag) {
			throw new Error("ルームがが見つかりません")
		}
		params.server_id = hashtag.server_id
	}

	if (params.recipient_id) {
		const recipient = await memcached.v1.user.show(db, { "id": params.recipient_id })
		if (!recipient) {
			throw new Error("ユーザーが見つかりません")
		}
	}

	if (typeof params.text !== "string") {
		throw new Error("本文を入力してください")
	}
	const urls = params.text.match(/!https?:\/\/[^\s 　]+/g)

	const entities = {}
	if (urls instanceof Array) {
		const entity_urls = []
		for (let n = 0; n < Math.min(urls.length, config.status.embed.web.limit); n++) {
			const original_url = urls[n].replace(/^!/, "")
			const { domain, image, title, description, url } = await extract_metadata(original_url)
			if (title && url) {
				entity_urls.push({ domain, image, title, description, url, original_url })
			}
		}
		if (entity_urls.length > 0) {
			entities.urls = entity_urls
		}
	}
	params.entities = entities

	const status = await api.v1.status.update(db, params)

	if (hashtag) {
		const collection = db.collection("hashtags")
		const result = await collection.updateOne(
			{ "_id": hashtag.id },
			{ "$inc": { "statuses_count": 1 } }
		)
		hashtag.statuses_count += 1		// キャッシュを直接変更
	}

	return status.id
}