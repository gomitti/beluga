
const markdown_pre = '"""'

const types = {
    "pre": "pre"
}

export const parse_markdown = text => {
    const lines = text.split("\n")
    let starting_tag = null
    const blocks = []
    let block = []
    for (const sentence of lines) {
        if (sentence === markdown_pre) {
            if (starting_tag === markdown_pre) {
                blocks.push(<pre className="status-body-pre">{block.map(sentence => {
                    return sentence + "\n"
                })}</pre>)
                block = []
                starting_tag = null
                continue
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
            continue
        }
        block.push(sentence + "\n")
    }
    if (block.length > 0) {
        for (const sentence of block) {
            blocks.push(sentence)
        }
        block = []
    }
    return blocks
}