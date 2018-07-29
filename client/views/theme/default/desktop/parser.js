import config from "../../../../beluga.config"
import parser from "./parser/index"
import assert, { is_object, is_string } from "../../../../assert"
import { get_image_url_from_shortname, unicode_emoji_regexp, map_unicode_id, map_id_shortname } from "../../../../stores/emoji"
import { parse_markdown } from "./parser/markdown"

const split_regexp = (components, regexp) => {
    const result = []
    for (const sentence of components) {
        if (sentence.length === 0) {
            result.push(sentence)
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
        if (!!sentence.match(/[\u2600-\u27bf]|[\uD800-\uDBFF]/) === false) {
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
            result.push(sentence)
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
            result.push(sentence)
            continue
        }
        if (!!sentence.match(/#[^\s 　]+/g) === false) {
            result.push(sentence)
            continue
        }
        // urlに#が含まれていたりする
        if (sentence.match(/^(!?https?:\/\/[^\s 　]+)/g)) {
            result.push(sentence)
            continue
        }
        const array = sentence.split(/(\s?#[^\s 　]+\s?)/g)
        for (const component of array) {
            if (component.length === 0) {
                continue
            }
            result.push(component.trim())
        }
    }
    return result
}
const split_mention = components => {
    const result = []
    for (const sentence of components) {
        if (sentence.length === 0) {
            result.push(sentence)
            continue
        }
        if (!!sentence.match(/@[0-9a-zA-Z_]+/g) === false) {
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
        const url = substr.replace(/^!?/, "")
        const display_text = decodeURI(url.replace(/^!?https?:\/\//, ""))
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

export const parse_tags = (substr, subviews, server, handlers) => {
    let node = parser.tags(substr, server, handlers)
    if (node) {
        subviews.push(node)
        return true
    }
    return false
}

export const parse_emoji_unicode = (substr, subviews) => {
    if (substr.match(/[\u0023\u00AE\u00A9\u2049\u203C\u2122-\u21AA\u2328-\u23FA\u24C2\u25AA-\u25FE\u2600-\u26FF\u2700-\u27bf\u2935\u2934\u3030\u303D\u3297\u3299\uD800-\uDBFF]/g)) {
        const emoji_id = map_unicode_id[substr]
        if (emoji_id) {
            const shortname = map_id_shortname[emoji_id]
            if (!!shortname == false) {
                throw new Error(`絵文字${shortname}が見つかりません`)
            }
            const src = get_image_url_from_shortname(shortname, null)
            if (src === null) {
                return false
            }
            subviews.push(<img key={`emoji-${shortname}-${subviews.length}`} alt={shortname} className="status-body-emoji" src={src} />)
            return true
        }
        subviews.push(substr)
        return true
    }
    return false
}

export const generate_image_from_emoji_shortname = (shortname, classname, key, server_id) => {
    const src = get_image_url_from_shortname(shortname, server_id)
    if (src === null) {
        return null
    }
    return <img key={key} alt={`:${shortname}:`} className={classname} src={src} />
}

export const parse_emoji_shortname = (substr, subviews, server) => {
    const m = substr.match(/^:([a-zA-Z0-9_]+):$/)
    if (m) {
        const shortname = m[1]
        const image = generate_image_from_emoji_shortname(shortname, "status-body-emoji", `emoji-${shortname}-${subviews.length}`, server.id)
        if (image) {
            subviews.push(image)
            return true
        }
        subviews.push(substr)
        return true
    }
    return false
}

export const parse = (sentence, server, status_entities, handlers) => {
    const subviews = []
    const components = split(sentence)
    for (const substr of components) {
        // 埋め込み
        if (parse_embed(substr, subviews, status_entities)) {
            continue
        }
        // ハッシュタグなど
        if (parse_tags(substr, subviews, server, handlers)) {
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
        if (parse_emoji_shortname(substr, subviews, server)) {
            continue
        }
        if (substr === "\n") {
            continue
        }
        // それ以外
        subviews.push(substr.trim())
    }
    return subviews
}

// 1行に複数のURLがあるものを分割する
export const divide_links = blocks => {
    const components = []
    for (const block of blocks) {
        if (is_string(block) === false) {
            components.push(block)
            continue
        }
        // 文字列の途中でURLが入っている場合は分割する
        const sentence = block
        const new_line = true
        const array = sentence.split(/(https?:\/\/[^\s 　]+)/g)
        if (array.length === 1) {
            components.push(sentence)
            continue
        }
        for (const piece of array) {
            if (piece.length === 0) {
                continue
            }
            if (piece === "\n") {
                continue
            }
            if (piece.match(/^[\s 　]+$/)) {
                continue
            }
            if (piece.match(/\.(jpg|gif|png|jpeg)(:orig)?$/)) {
                components.push(piece)
                new_line = true // 後続の文字列は次の行へ移動する
                continue
            }
            if (new_line) {
                components.push(piece)
                new_line = false
                continue
            }
            // 文字列同士は分離せず繋げる
            const last = components[components.length - 1]
            components[components.length - 1] = last + piece
        }
    }
    return components
}

const build_image_views = (urls, server, status_entities) => {
    if (urls.length <= 3) {
        const imageViews = []
        for (const image_source of urls) {
            const nodes = parse(image_source, server, status_entities, {})
            for (const view of nodes) {
                imageViews.push(view)
            }
        }
        return [<div className="status-body-gallery">{imageViews}</div>]
    }
    const views = []
    const num_divide = parseInt(Math.ceil(urls.length / 3))
    for (let n = 0; n < num_divide; n++) {
        const end = Math.min((n + 1) * 3, urls.length)
        const subset = urls.slice(n * 3, end)
        const imageViews = []
        for (const image_source of subset) {
            const nodes = parse(image_source, server, status_entities, {})
            for (const view of nodes) {
                imageViews.push(view)
            }
        }
        views.push(<div className="status-body-gallery">{imageViews}</div>)
    }
    return views
}

export const merge_images = (blocks, server, status_entities) => {
    const components = []
    let image_urls = []
    for (const block of blocks) {
        if (is_string(block) === false) {
            if (image_urls.length > 0) {
                const imageViews = build_image_views(image_urls, server, status_entities)
                for (const imageView of imageViews) {
                    components.push(imageView)
                }
                image_urls = []
            }
            components.push(block)
            continue
        }
        if (block.length === 0) {
            continue
        }
        if (block.match(/^https?:\/\/.+?\.(jpg|png|gif|jpeg)(:orig)?$/)) {
            image_urls.push(block)
            continue
        }
        if (block.match(/^[  ]$/)) {
            // 画像一覧の途中で空白が入るのを防ぐ
            if (image_urls.length > 0) {
                continue
            }
        }
        // 画像以外のものが来たので中断
        if (image_urls.length > 0) {
            const imageViews = build_image_views(image_urls, server, status_entities)
            for (const imageView of imageViews) {
                components.push(imageView)
            }
            image_urls = []
        }
        components.push(block)
    }
    if (image_urls.length > 0) {
        const imageViews = build_image_views(image_urls, server, status_entities)
        for (const imageView of imageViews) {
            components.push(imageView)
        }
        image_urls = []
    }
    return components
}

export const build_status_body_views = (text, server, status_entities, click_handlers) => {
    assert(is_string(text), "@text must be of type string")
    assert(is_object(server), "@server must be of type object")
    assert(is_object(status_entities), "@status_entities must be of type object")
    assert(is_object(click_handlers), "@click_handlers must be of type object")

    let blocks = parse_markdown(text)
    blocks = divide_links(blocks)
    blocks = merge_images(blocks, server, status_entities)

    // 絵文字だけの場合表示サイズを大きくする
    let emoji_found = false
    let emoji_continuing = true

    const bodyViews = []
    for (const component of blocks) {
        // 画像以外
        if (is_string(component)) {
            if (component === "\n") {
                bodyViews.push(<p></p>)
                continue
            }
            const children = parse(component, server, status_entities, click_handlers)
            for (const dom of children) {
                if (dom.key && dom.key.match(/^emoji-/)) {
                    emoji_found = true
                } else {
                    emoji_continuing = false
                }
            }
            let classname = null
            if (emoji_found && emoji_continuing && blocks.length === 1) {
                classname = "bigger-emoji"
            }
            bodyViews.push(<p className={classname} key={`line-${bodyViews.length}`}>{children}</p>)
            continue
        }
        // それ以外のビュー
        bodyViews.push(component)
    }
    return bodyViews
}