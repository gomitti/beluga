import config from "../../../beluga.config"
import parser from "./parser/index"
import assert, { is_object } from "../../../assert"
import { map_unicode_fname, map_shortname_fname, unicode_emoji_regexp } from "./parser/emoji"

const split_regexp = (components, regexp) => {
	const result = []
	for (const sentence of components) {
		if (sentence.length === 0) {
			continue
		}
		const array = sentence.split(regexp)
		for (const component of array) {
			if (component.length === 0) {
				continue
			}
			result.push(component)
		}
	}
	return result
}
export const split_emoji_unicode = components => {
	const result = []
	for (const sentence of components) {
		if (sentence.length === 0) {
			continue
		}
		if (!sentence.match(/[\u2700-\u27bf]|[\uD800-\uDBFF]/)) {
			result.push(sentence)
			continue
		}
		const array = sentence.split(unicode_emoji_regexp)
		for (const component of array) {
			if (component.length === 0) {
				continue
			}
			result.push(component)
		}
	}
	return result
}
const split_emoji_shortname = components => {
	const result = []
	for (const sentence of components) {
		if (sentence.length === 0) {
			continue
		}
		if (!sentence.match(/:[a-zA-Z0-9_\-+]+:/g)) {
			result.push(sentence)
			continue
		}
		const array = sentence.split(/(:[a-zA-Z0-9_\-+]+:)/g)
		for (const component of array) {
			if (component.length === 0) {
				continue
			}
			result.push(component)
		}
	}
	return result
}
const split_hashtag = components => {
	const result = []
	for (const sentence of components) {
		if (sentence.length === 0) {
			continue
		}
		if (!sentence.match(/#[^\s 　]+/g)) {
			result.push(sentence)
			continue
		}
		if (sentence.match(/^(!?https?:\/\/[^\s 　]+)/g)){
			result.push(sentence)
			continue
		}
		const array = sentence.split(/(#[^\s 　]+)/g)
		for (const component of array) {
			if (component.length === 0) {
				continue
			}
			result.push(component)
		}
	}
	return result
}
const split_mention = components => {
	const result = []
	for (const sentence of components) {
		if (sentence.length === 0) {
			continue
		}
		if (!sentence.match(/@[0-9a-zA-Z_]+/g)) {
			result.push(sentence)
			continue
		}
		if (sentence.match(/^(!?https?:\/\/[^\s 　]+)/g)) {
			result.push(sentence)
			continue
		}
		const array = sentence.split(/(@[0-9a-zA-Z_]+)/g)
		for (const component of array) {
			if (component.length === 0) {
				continue
			}
			result.push(component)
		}
	}
	return result
}
const split = sentence => {
	let components = typeof sentence === "string" ? [sentence] : sentence
	components = split_regexp(components, /(!?https?:\/\/[^\s 　]+)/g)
	components = split_mention(components)
	components = split_hashtag(components)
	components = split_emoji_unicode(components)
	components = split_emoji_shortname(components)
	return components
}

export const parse_link = (substr, subviews) => {
	if (substr.match(/^!?https?:\/\/[^\s 　]+/)) {
		if (substr.indexOf(".") === -1) {
			subviews.push(substr)
			return true
		}
		let node = parser.image(substr)
		if (node) {
			subviews.push(node)
			return true
		}
		node = parser.video(substr)
		if (node) {
			subviews.push(node)
			return true
		}
		const url = substr
		const display_text = decodeURI(url.replace(/!?https?:\/\//, ""))
		subviews.push(<a href={url} className="status-body-link user-defined-color user-defined-color-hover" target="_blank">{display_text}</a>)
		return true
	}
	return false
}

export const parse_embed = (substr, subviews, entities) => {
	if (substr.match(/^!https?:\/\/[^\s 　]+/)) {
		let node = parser.embed(substr, entities)
		if (node) {
			subviews.push(node)
			return true
		}
	}
	return false
}

export const parse_tags = (substr, subviews, status, handlers) => {
	let node = parser.tags(substr, status, handlers)
	if (node) {
		subviews.push(node)
		return true
	}
	return false
}

export const parse_emoji_unicode = (substr, subviews) => {
	if (substr.match(/[\u0023\u00AE\u00A9\u2049\u203C\u2122-\u21AA\u2328-\u23FA\u24C2\u25AA-\u25FE\u2600-\u26FF\u2700-\u27bf\u2935\u2934\u3030\u303D\u3297\u3299\uD800-\uDBFF]/g)) {
		const metadata = map_unicode_fname[substr]
		if (metadata) {
			const fname = metadata[0]
			const shortname = metadata.length == 2 ? metadata[1] : null
			const alt = shortname ? shortname : substr
			subviews.push(<img alt={alt} className="status-body-emoji" src={`/asset/emoji/64x64/${fname}.png`} />)
			return true
		}
		subviews.push(substr)
		return true
	}
	return false
}

export const parse_emoji_shortname = (substr, subviews) => {
	if (substr.match(/^:[a-zA-Z0-9_]+:$/)) {
		const fname = map_shortname_fname[substr]
		if (fname) {
			subviews.push(<img alt={substr} className="status-body-emoji" src={`/asset/emoji/64x64/${fname}.png`} />)
			return true
		}
		subviews.push(substr)
		return true
	}
	return false
}

export default (sentence, status, handlers) => {
	const entities = status ? status.entities : {}
	const subviews = []
	const components = split(sentence)
	for (const substr of components) {
		// 埋め込み
		if (parse_embed(substr, subviews, entities)) {
			continue
		}
		// ハッシュタグなど
		if (parse_tags(substr, subviews, status, handlers)) {
			continue
		}
		// リンク
		if (parse_link(substr, subviews)) {
			continue
		}
		// 絵文字（ユニコード）
		if (parse_emoji_unicode(substr, subviews)) {
			continue
		}
		// 絵文字（shortname）
		if (parse_emoji_shortname(substr, subviews)) {
			continue
		}
		// それ以外
		subviews.push(substr)
	}
	return subviews
}