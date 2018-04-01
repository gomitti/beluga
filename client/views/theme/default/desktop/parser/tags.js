import config from "../../../../../beluga.config"
import TweetView from "../status/tweet"
import WebsiteView from "../status/website"
import assert, { is_function, is_object } from "../../../../../assert"

export default (sentence, status, handlers) => {
    assert(is_object(status), "@status must be of type object")
    assert(is_object(handlers), "@handlers must be of type object")
    const { server } = status
    assert(is_object(server), "@server must be of type object")
    if (sentence.match(/^#[^\s 　]+/)) {
        const { onClickHashtag } = handlers
        const tagname = sentence.slice(1)
        if (!onClickHashtag) {
            return <a href={`/server/${server.name}/${tagname}`} className="status-body-hashtag" data-tagname={tagname}>{tagname}</a>
        }
        assert(is_function(onClickHashtag), "@onClickHashtag must be function")
        return <a href={`/server/${server.name}/${tagname}`} onClick={onClickHashtag} className="status-body-hashtag" data-tagname={tagname}>{tagname}</a>
    }
    if (sentence.match(/@[0-9a-zA-Z_]+/)) {
        const { onClickMention } = handlers
        const name = sentence.slice(1)
        if (!onClickMention) {
            return <a href={`/server/${server.name}/@${name}`} className="status-body-mention" data-name={name}>{name}</a>
        }
        assert(is_function(onClickMention), "@onClickMention must be function")
        return <a href={`/server/${server.name}/@${name}`} onClick={onClickMention} className="status-body-mention" data-name={name}>{name}</a>
    }
    return null
}