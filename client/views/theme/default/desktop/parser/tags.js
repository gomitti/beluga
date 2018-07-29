import config from "../../../../../beluga.config"
import TweetView from "../status/tweet"
import WebsiteView from "../status/website"
import assert, { is_function, is_object } from "../../../../../assert"

export default (sentence, server, handlers) => {
    assert(is_object(handlers), "@handlers must be of type object")
    assert(is_object(server), "@server must be of type object")
    if (sentence.match(/^#[^\s 　]+/)) {
        const { handle_click_hashtag } = handlers
        const tagname = sentence.slice(1)
        if (!!handle_click_hashtag === false) {
            return <a href={`/server/${server.name}/${tagname}`} className="status-body-hashtag" data-tagname={tagname}>{tagname}</a>
        }
        assert(is_function(handle_click_hashtag), "@handle_click_hashtag must be function")
        return <a href={`/server/${server.name}/${tagname}`} onClick={handle_click_hashtag} className="status-body-hashtag" data-tagname={tagname}>{tagname}</a>
    }
    if (sentence.match(/@[0-9a-zA-Z_]+/)) {
        const { handle_click_mention } = handlers
        const name = sentence.slice(1)
        if (!!handle_click_mention === false) {
            return <a href={`/server/${server.name}/@${name}`} className="status-body-mention" data-name={name}>{name}</a>
        }
        assert(is_function(handle_click_mention), "@handle_click_mention must be function")
        return <a href={`/server/${server.name}/@${name}`} onClick={handle_click_mention} className="status-body-mention" data-name={name}>{name}</a>
    }
    return null
}