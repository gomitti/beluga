import { Component } from "react"
import classnames from "classnames"
import config from "../../../../beluga.config"
import parser from "./parser/index"
import assert, { is_object, is_string } from "../../../../assert"
import { get_image_url_by_shortname_or_null, unicode_emoji_regexp, get_shortname_by_unicode } from "../../../../stores/theme/default/common/emoji"
import { parse_block_markdown, parse_inline_markdown } from "./parser/markdown"
import Tooltip from "./tooltip"

class EmojiComponent extends Component {
    render() {
        const { shortname, key, image_url } = this.props
        return (
            <span className="status-body-emoji emoji-sizer"
                key={key}
                ref={dom => this.dom = dom}
                style={{
                    "backgroundImage": `url(${image_url})`
                }}
                onMouseEnter={() => Tooltip.show(this.dom, `:${shortname}:`, 6)}
                onMouseOver={() => Tooltip.show(this.dom, `:${shortname}:`, 6)}
                onMouseOut={() => Tooltip.hide()}>{`:${shortname}:`}</span>
        )
        return (
            <button
                className="status-body-emoji emoji-sizer"
                key={key}
                ref={dom => this.dom = dom}
                style={{
                    "backgroundImage": `url(${image_url})`
                }}
                onMouseEnter={() => Tooltip.show(this.dom, `:${shortname}:`, 6)}
                onMouseOver={() => Tooltip.show(this.dom, `:${shortname}:`, 6)}
                onMouseOut={() => Tooltip.hide()}>
            </button>
        )
    }
}

const split_regexp = (splits, regexp) => {
    const result = []
    splits.forEach(sentence => {
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
export const split_emoji_unicode = splits => {
    const result = []
    splits.forEach(sentence => {
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
const split_emoji_shortname = splits => {
    const result = []
    splits.forEach(sentence => {
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
const split_channel = splits => {
    const result = []
    splits.forEach(sentence => {
        if (sentence.length === 0) {
            result.push(sentence)
            return
        }
        // if (!!sentence.match(/#[^\s 　]+/g) === false) {
        //     result.push(sentence)
        //     return
        // }
        // if (sentence.match(/[^\s]#[^\s 　]+/g)) {
        //     result.push(sentence)
        //     return
        // }
        // // urlに#が含まれていたりする
        // if (sentence.match(/^(!?https?:\/\/[^\s 　]+)/g)) {
        //     result.push(sentence)
        //     return
        // }
        const array = sentence.split(/(^#[^\s 　@]+)|(\s#[^\s 　@]+)/g)
        array.forEach(m => {
            if (!!m === false) {
                return
            }
            if (m.length === 0) {
                return
            }
            const space_and_channel = m.split(/(\s)(#[^\s 　@]+)/)
            space_and_channel.forEach(k => {
                if (!!k === false) {
                    return
                }
                if (k.length === 0) {
                    return
                }
                result.push(k)
            })
        })
    })
    return result
}
const split_mention = splits => {
    const result = []
    splits.forEach(sentence => {
        if (sentence.length === 0) {
            result.push(sentence)
            return
        }
        // if (sentence.match(/^(!?https?:\/\/[^\s 　]+)/g)) {
        //     result.push(sentence)
        //     return
        // }
        // if (sentence.match(/[^\s]@[0-9a-zA-Z_]+/g)) {
        //     result.push(sentence)
        //     return
        // }
        // if (sentence.match(/[^\s]@[0-9a-zA-Z_]+/g)) {
        //     result.push(sentence)
        //     return
        // }
        // if (!!sentence.match(/@[0-9a-zA-Z_]+/g) === false) {
        //     result.push(sentence)
        //     return
        // }
        const array = sentence.split(/(^@[0-9a-zA-Z_]+)|(\s@[0-9a-zA-Z_]+)/g)
        array.forEach(m => {
            if (!!m === false) {
                return
            }
            if (m.length === 0) {
                return
            }
            const space_and_mention = m.split(/(\s)(@[0-9a-zA-Z_]+)/)
            space_and_mention.forEach(k => {
                if (!!k === false) {
                    return
                }
                if (k.length === 0) {
                    return
                }
                result.push(k)
            })
        })
    })
    return result
}
const split = sentence => {
    let splits = typeof sentence === "string" ? [sentence] : sentence
    splits = split_regexp(splits, /(!?https?:\/\/[^\s 　]+)/g)
    splits = split_mention(splits)
    splits = split_channel(splits)
    splits = split_emoji_unicode(splits)
    splits = split_emoji_shortname(splits)
    if (splits.length > 0) {
        const last = splits[splits.length - 1]
        if (last === "\n") {
            splits.pop()
        }
    }
    return splits
}

export const parse_link = (substr, subviews) => {
    if (substr.match(/^!?https?:\/\/[^\s 　]+/)) {
        // if (substr.indexOf(".") === -1) {
        //     subviews.push(substr)
        //     return true
        // }
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
        let url = substr.replace(/\/$/, "")
        url = url.replace(/^!/, "")
        const display_text = decodeURI(url.replace(/^https?:\/\//, ""))
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

export const parse_tags = (substr, subviews, community, handlers) => {
    const node = parser.tags(substr, community, handlers)
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
            const image_url = get_image_url_by_shortname_or_null(shortname, null)
            if (image_url === null) {
                return false
            }
            subviews.push(<EmojiComponent key={`emoji-${shortname}-${subviews.length}`} image_url={image_url} shortname={shortname} />)
            return true
        }
        subviews.push(substr)
        return true
    }
    return false
}

export const parse_emoji_shortname = (substr, subviews, community) => {
    if (!!community === false) {
        return null
    }
    const m = substr.match(/^:([a-zA-Z0-9_]+):$/)
    if (m) {
        const shortname = m[1]
        const image_url = get_image_url_by_shortname_or_null(shortname, community.id)
        if (image_url) {
            subviews.push(<EmojiComponent key={`emoji-${shortname}-${subviews.length}`} image_url={image_url} shortname={shortname} />)
            return true
        }
        subviews.push(substr)
        return true
    }
    return false
}

export const parse = (sentence, community, status_entities, handlers) => {
    const subviews = []
    const splits = split(sentence)
    let num_emojis = 0
    splits.forEach(substr => {
        // 埋め込み
        if (parse_embed(substr, subviews, status_entities)) {
            return
        }
        // ハッシュタグなど
        if (parse_tags(substr, subviews, community, handlers)) {
            return
        }
        // リンク
        if (parse_link(substr, subviews)) {
            return
        }
        // 絵文字（ユニコード）
        if (parse_emoji_unicode(substr, subviews)) {
            num_emojis++;
            return
        }
        // 絵文字（shortname）
        if (parse_emoji_shortname(substr, subviews, community)) {
            num_emojis++;
            return
        }
        // インラインのMarkdown
        if (parse_inline_markdown(substr, subviews)) {
            return
        }
        // それ以外
        subviews.push(<span className="chunk">{substr.trim()}</span>)
    })
    const contains_only_emojis = (num_emojis === splits.length)
    return { subviews, contains_only_emojis }
}

// 1行に複数のURLがあるものを分割する
export const divide_links = blocks => {
    const splits = []
    blocks.forEach(sentence => {
        if (is_string(sentence) === false) {
            splits.push(sentence)
            return
        }
        // 文字列の途中でURLが入っている場合は分割する
        let new_line = true
        const array = sentence.split(/(https?:\/\/[^\s 　]+)/g)
        if (array.length === 1) {
            splits.push(sentence)
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
                splits.push(piece)
                new_line = true // 後続の文字列は次の行へ移動する
                return
            }
            if (new_line) {
                splits.push(piece)
                new_line = false
                return
            }
            // 文字列同士は分離せず繋げる
            const last = splits[splits.length - 1]
            splits[splits.length - 1] = last + piece
        })
    })
    return splits
}

const build_image_views = (urls, community, status_entities) => {
    if (urls.length <= 3) {
        const imageViews = []
        urls.forEach(image_source => {
            const { subviews } = parse(image_source, community, status_entities, {})
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
            const { subviews } = parse(image_source, community, status_entities, {})
            subviews.forEach(view => {
                imageViews.push(view)
            })
        })
        views.push(<div className="status-body-gallery">{imageViews}</div>)
    }
    return views
}

export const merge_images = (blocks, community, status_entities) => {
    const splits = []
    let image_urls = []
    blocks.forEach(block => {
        if (is_string(block) === false) {
            if (image_urls.length > 0) {
                const imageViews = build_image_views(image_urls, community, status_entities)
                imageViews.forEach(imageView => {
                    splits.push(imageView)
                })
                image_urls = []
            }
            splits.push(block)
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
            const imageViews = build_image_views(image_urls, community, status_entities)
            imageViews.forEach(imageView => {
                splits.push(imageView)
            })
            image_urls = []
        }
        splits.push(block)
    })
    if (image_urls.length > 0) {
        const imageViews = build_image_views(image_urls, community, status_entities)
        imageViews.forEach(imageView => {
            splits.push(imageView)
        })
        image_urls = []
    }
    return splits
}

export const build_status_body_views = (text, community, status_entities, click_handlers) => {
    assert(is_string(text), "$text must be of type string")
    assert(is_object(status_entities), "$status_entities must be of type object")
    assert(is_object(click_handlers), "$click_handlers must be of type object")

    let blocks = parse_block_markdown(text)
    blocks = divide_links(blocks)
    blocks = merge_images(blocks, community, status_entities)

    const bodyViews = []
    blocks.forEach(component => {
        // 画像以外
        if (is_string(component)) {
            if (component === "\n") {
                bodyViews.push(<div className="sentence"></div>)
                return
            }
            const { subviews, contains_only_emojis } = parse(component, community, status_entities, click_handlers)
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