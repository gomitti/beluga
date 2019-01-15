import { Component } from "react"
import classnames from "classnames"
import config from "../../../../beluga.config"
import parser from "./parser/index"
import assert, { is_object, is_string } from "../../../../assert"
import { get_image_url_by_shortname_or_null, unicode_emoji_regexp, get_shortname_by_unicode } from "../../../../stores/theme/default/common/emoji"
import { parse_block_markdown, parse_inline_markdown } from "./parser/markdown"
import Tooltip from "./tooltip"

class EmojiView extends Component {
    render() {
        const { shortname, key, image } = this.props
        return (
            <button
                className="status-body-emoji"
                key={key}
                ref={dom => this.dom = dom}
                onMouseEnter={() => Tooltip.show(this.dom, `:${shortname}:`, 6)}
                onMouseOver={() => Tooltip.show(this.dom, `:${shortname}:`, 6)}
                onMouseOut={() => Tooltip.hide()}>
                {image}
            </button>
        )
    }
}

const split_regexp = (components, regexp) => {
    const result = []
    components.forEach(sentence => {
        if (sentence.length === 0) {
            result.push(sentence)
            return
        }
        const array = sentence.split(regexp)
        array.forEach(component => {
            if (component.length === 0) {
                return
            }
            result.push(component)
        })
    })
    return result
}
export const split_emoji_unicode = components => {
    const result = []
    components.forEach(sentence => {
        if (sentence.length === 0) {
            return
        }
        if (!!sentence.match(/[\u2600-\u27bf]|[\uD800-\uDBFF]/) === false) {
            result.push(sentence)
            return
        }
        const array = sentence.split(unicode_emoji_regexp)
        array.forEach(component => {
            if (component.length === 0) {
                return
            }
            result.push(component)
        })
    })
    return result
}
const split_emoji_shortname = components => {
    const result = []
    components.forEach(sentence => {
        if (sentence.length === 0) {
            result.push(sentence)
            return
        }
        if (!sentence.match(/:[a-zA-Z0-9_\-+]+:/g)) {
            result.push(sentence)
            return
        }
        const array = sentence.split(/(:[a-zA-Z0-9_\-+]+:)/g)
        array.forEach(component => {
            if (component.length === 0) {
                return
            }
            result.push(component)
        })
    })
    return result
}
const split_channel = components => {
    const result = []
    components.forEach(sentence => {
        if (sentence.length === 0) {
            result.push(sentence)
            return
        }
        if (!!sentence.match(/#[^\s 　]+/g) === false) {
            result.push(sentence)
            return
        }
        // urlに#が含まれていたりする
        if (sentence.match(/^(!?https?:\/\/[^\s 　]+)/g)) {
            result.push(sentence)
            return
        }
        const array = sentence.split(/(\s?#[^\s 　]+\s?)/g)
        array.forEach(component => {
            if (component.length === 0) {
                return
            }
            result.push(component.trim())
        })
    })
    return result
}
const split_mention = components => {
    const result = []
    components.forEach(sentence => {
        if (sentence.length === 0) {
            result.push(sentence)
            return
        }
        if (!!sentence.match(/@[0-9a-zA-Z_]+/g) === false) {
            result.push(sentence)
            return
        }
        if (sentence.match(/^(!?https?:\/\/[^\s 　]+)/g)) {
            result.push(sentence)
            return
        }
        const array = sentence.split(/(@[0-9a-zA-Z_]+)/g)
        array.forEach(component => {
            if (component.length === 0) {
                return
            }
            result.push(component)
        })
    })
    return result
}
const split = sentence => {
    let components = typeof sentence === "string" ? [sentence] : sentence
    components = split_regexp(components, /(!?https?:\/\/[^\s 　]+)/g)
    components = split_mention(components)
    components = split_channel(components)
    components = split_emoji_unicode(components)
    components = split_emoji_shortname(components)
    if (components.length > 0) {
        const last = components[components.length - 1]
        if (last === "\n") {
            components.pop()
        }
    }
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
        const node = parser.embed(substr, entities)
        if (node) {
            subviews.push(node)
            return true
        }
    }
    return false
}

export const parse_tags = (substr, subviews, server, handlers) => {
    const node = parser.tags(substr, server, handlers)
    if (node) {
        subviews.push(node)
        return true
    }
    return false
}

export const parse_emoji_unicode = (substr, subviews) => {
    if (substr.match(/[\u0023\u00AE\u00A9\u2049\u203C\u2122-\u21AA\u2328-\u23FA\u24C2\u25AA-\u25FE\u2600-\u26FF\u2700-\u27bf\u2935\u2934\u3030\u303D\u3297\u3299\uD800-\uDBFF]/g)) {
        const shortname = get_shortname_by_unicode(substr)
        if (shortname) {
            const image = generate_image_from_emoji_shortname(shortname, "image", null, null)
            if (image === null) {
                return false
            }
            subviews.push(<EmojiView key={`emoji-${shortname}-${subviews.length}`} image={image} shortname={shortname} />)
            return true
        }
        subviews.push(substr)
        return true
    }
    return false
}

export const generate_image_from_emoji_shortname = (shortname, classname, key, server_id) => {
    const src = get_image_url_by_shortname_or_null(shortname, server_id)
    if (src === null) {
        return null
    }
    return <img key={key} alt={`:${shortname}:`} className={classname} src={src} />
}

export const parse_emoji_shortname = (substr, subviews, server) => {
    const m = substr.match(/^:([a-zA-Z0-9_]+):$/)
    if (m) {
        const shortname = m[1]
        const image = generate_image_from_emoji_shortname(shortname, "image", null, server.id)
        if (image) {
            subviews.push(<EmojiView key={`emoji-${shortname}-${subviews.length}`} image={image} shortname={shortname} />)
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
    let num_emoji_components = 0
    components.forEach(substr => {
        // 埋め込み
        if (parse_embed(substr, subviews, status_entities)) {
            return
        }
        // ハッシュタグなど
        if (parse_tags(substr, subviews, server, handlers)) {
            return
        }
        // リンク
        if (parse_link(substr, subviews)) {
            return
        }
        // 絵文字（ユニコード）
        if (parse_emoji_unicode(substr, subviews)) {
            num_emoji_components++;
            return
        }
        // 絵文字（shortname）
        if (parse_emoji_shortname(substr, subviews, server)) {
            num_emoji_components++;
            return
        }
        // インラインのMarkdown
        if (parse_inline_markdown(substr, subviews)) {
            return
        }
        // それ以外
        subviews.push(substr.trim())
    })
    const contains_only_emojis = (num_emoji_components === components.length)
    return { subviews, contains_only_emojis }
}

// 1行に複数のURLがあるものを分割する
export const divide_links = blocks => {
    const components = []
    blocks.forEach(sentence => {
        if (is_string(sentence) === false) {
            components.push(sentence)
            return
        }
        // 文字列の途中でURLが入っている場合は分割する
        let new_line = true
        const array = sentence.split(/(https?:\/\/[^\s 　]+)/g)
        if (array.length === 1) {
            components.push(sentence)
            return
        }
        array.forEach(piece => {
            if (piece.length === 0) {
                return
            }
            if (piece === "\n") {
                return
            }
            if (piece.match(/^[\s 　]+$/)) {
                return
            }
            if (piece.match(/\.(jpg|gif|png|jpeg)(:orig)?$/)) {
                components.push(piece)
                new_line = true // 後続の文字列は次の行へ移動する
                return
            }
            if (new_line) {
                components.push(piece)
                new_line = false
                return
            }
            // 文字列同士は分離せず繋げる
            const last = components[components.length - 1]
            components[components.length - 1] = last + piece
        })
    })
    return components
}

const build_image_views = (urls, server, status_entities) => {
    if (urls.length <= 3) {
        const imageViews = []
        urls.forEach(image_source => {
            const { subviews } = parse(image_source, server, status_entities, {})
            subviews.forEach(view => {
                imageViews.push(view)
            })
        })
        return [<div className="status-body-gallery">{imageViews}</div>]
    }
    const views = []
    const num_divide = parseInt(Math.ceil(urls.length / 3))
    for (let n = 0; n < num_divide; n++) {
        const end = Math.min((n + 1) * 3, urls.length)
        const subset = urls.slice(n * 3, end)
        const imageViews = []
        subset.forEach(image_source => {
            const { subviews } = parse(image_source, server, status_entities, {})
            subviews.forEach(view => {
                imageViews.push(view)
            })
        })
        views.push(<div className="status-body-gallery">{imageViews}</div>)
    }
    return views
}

export const merge_images = (blocks, server, status_entities) => {
    const components = []
    let image_urls = []
    blocks.forEach(block => {
        if (is_string(block) === false) {
            if (image_urls.length > 0) {
                const imageViews = build_image_views(image_urls, server, status_entities)
                imageViews.forEach(imageView => {
                    components.push(imageView)
                })
                image_urls = []
            }
            components.push(block)
            return
        }
        if (block.length === 0) {
            return
        }
        if (block.match(/^https?:\/\/.+?\.(jpg|png|gif|jpeg)(:orig)?$/)) {
            image_urls.push(block)
            return
        }
        if (block.match(/^[  ]$/)) {
            // 画像一覧の途中で空白が入るのを防ぐ
            if (image_urls.length > 0) {
                return
            }
        }
        // 画像以外のものが来たので中断
        if (image_urls.length > 0) {
            const imageViews = build_image_views(image_urls, server, status_entities)
            imageViews.forEach(imageView => {
                components.push(imageView)
            })
            image_urls = []
        }
        components.push(block)
    })
    if (image_urls.length > 0) {
        const imageViews = build_image_views(image_urls, server, status_entities)
        imageViews.forEach(imageView => {
            components.push(imageView)
        })
        image_urls = []
    }
    return components
}

export const build_status_body_views = (text, server, status_entities, click_handlers) => {
    assert(is_string(text), "$text must be of type string")
    assert(is_object(server), "$server must be of type object")
    assert(is_object(status_entities), "$status_entities must be of type object")
    assert(is_object(click_handlers), "$click_handlers must be of type object")

    let blocks = parse_block_markdown(text)
    blocks = divide_links(blocks)
    blocks = merge_images(blocks, server, status_entities)

    const bodyViews = []
    blocks.forEach(component => {
        // 画像以外
        if (is_string(component)) {
            if (component === "\n") {
                bodyViews.push(<div className="sentence"></div>)
                return
            }
            const { subviews, contains_only_emojis } = parse(component, server, status_entities, click_handlers)
            if (subviews.length === 0) {
                return
            }
            return bodyViews.push(
                <div className={classnames("sentence", {
                    "bigger-emoji": contains_only_emojis
                })}
                    key={`line-${bodyViews.length}`}>
                    {subviews}
                </div>
            )
        }
        // それ以外のビュー
        bodyViews.push(component)
    })
    return bodyViews
}