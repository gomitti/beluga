import assert, { is_array, is_string } from "../../../../../assert"
import config from "../../../../../beluga.config"

const escape = string => {
    return string.replace(/[.*+?^=!:${}()|[\]\/\\]/g, "\\$&")
}

const markdown_pre = config.markdown.pre
const markdown_big = config.markdown.big
const markdown_code = config.markdown.code
const markdown_italic = config.markdown.italic
const markdown_underline = config.markdown.underline
const markdown_emphasis = config.markdown.emphasis
const markdown_strikethrough = config.markdown.strikethrough

// 正規表現を組み立てる時、タグの文字数が多いものから順に設定する必要がある
// 例えば**と*は**の方の優先順位を高くしないと**が*と*に分解されてしまう
const markdown_inline_regex_str = `(${escape(markdown_big)})|(${escape(markdown_emphasis)})|(${escape(markdown_strikethrough)})|(${escape(markdown_code)})|(${escape(markdown_italic)})|(${escape(markdown_underline)})`
const markdown_inline_split_regex = new RegExp(markdown_inline_regex_str)
const markdown_inline_compare_regex = new RegExp(`^${markdown_inline_regex_str}$`)


const wrap_with_tag = (tag, inner) => {
    if (tag === markdown_big) {
        return <span className="status-body-big">{inner}</span>
    }
    if (tag === markdown_code) {
        return <span className="status-body-code">{inner}</span>
    }
    if (tag === markdown_italic) {
        return <span className="status-body-italic">{inner}</span>
    }
    if (tag === markdown_emphasis) {
        return <span className="status-body-emphasis">{inner}</span>
    }
    if (tag === markdown_strikethrough) {
        return <span className="status-body-strikethrough">{inner}</span>
    }
    if (tag === markdown_underline) {
        return <span className="status-body-underline">{inner}</span>
    }
    return null
}

const gather_inline_markdown_inner_nodes = components => {
    assert(components.length > 0, "$components.length must be grater than 0 ")
    if (components.length == 1) {
        return components[0]
    }
    const ret = []
    let inner = []
    let dest = ret
    let starting_tag = null
    components.forEach(substr => {
        if (substr.match(markdown_inline_compare_regex)) {
            if (starting_tag === substr) {  // 閉じタグ
                if (inner.length > 0) {
                    const inner_nodes = gather_inline_markdown_inner_nodes(inner)
                    ret.push(wrap_with_tag(starting_tag, inner_nodes))
                }
                inner = []
                starting_tag = null
                dest = ret
                return
            }
            if (starting_tag === null) {
                // 開始タグ
                starting_tag = substr
                dest = inner
                return
            }
        }
        dest.push(substr)
    })
    if (starting_tag !== null) {
        ret.push(starting_tag)
        return ret.concat(inner)
    }
    return ret
}

export const parse_inline_markdown = (substr, subviews) => {
    const tmp = substr.split(markdown_inline_split_regex)
    // undefinedが含まれるので除外する
    const components = []
    tmp.forEach(substr => {
        if (is_string(substr) && substr.length > 0) {
            components.push(substr)
        }
    })
    if (components.length === 1) {
        subviews.push(components[0])
        return true
    }
    const nodes = gather_inline_markdown_inner_nodes(components)
    if (is_string(nodes)) {
        subviews.push(nodes)
        return true
    }
    nodes.forEach(node => {
        subviews.push(node)
    })
    return true
}


export const parse_block_markdown = text => {
    const lines = text.split("\n")
    let starting_tag = null
    const blocks = []
    let block = []
    lines.forEach(sentence => {
        if (sentence === markdown_pre) {
            if (starting_tag === markdown_pre) {
                blocks.push(<pre className="status-body-pre">{block.map(sentence => {
                    return sentence + "\n"
                })}</pre>)
                block = []
                starting_tag = null
                return
            }
            if (starting_tag === null) {
                starting_tag = markdown_pre
                if (block.length > 0) {
                    for (const sentence of block) {
                        blocks.push(sentence)
                    }
                }
                block = []
            }
            return
        }
        block.push(sentence + "\n")
    })
    if (block.length > 0) {
        block.forEach(sentence => {
            blocks.push(sentence)
        })
        block = []
    }
    return blocks
}