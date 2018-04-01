import status from "./status"
import user from "./user"
import account from "./account"
import hashtag from "./hashtag"
import server from "./server"
import reaction from "./reaction"
import favorite from "./favorite"
import media from "./media"
import timeline from "./timeline"
import access_token from "./access_token"
import { delete_status_from_cache } from "./status/show"
import { delete_status_favorited_from_cache } from "./favorite/favorited"
import { delete_status_favorited_by_from_cache } from "./favorite/favorited_by"
import { delete_status_reaction_from_cache } from "./reaction/show"
import { delete_hashtag_from_cache } from "./hashtag/show"
import { delete_server_hashtags_from_cache } from "./server/hashtags"
import { delete_server_from_cache } from "./server/show"
import { delete_user_from_cache } from "./user/show"
import { delete_account_favorite_media_from_cache } from "./account/favorite/media/list"
import { delete_account_favorite_emoji_from_cache } from "./account/favorite/emoji/list"
import { delete_timeline_hashtag_from_cache } from "./timeline/hashtag"
import { delete_timeline_home_from_cache } from "./timeline/home"
import { delete_timeline_mentions_from_cache } from "./timeline/mentions"
import { delete_timeline_server_from_cache } from "./timeline/server"
import { delete_media_from_cache } from "./media/show"
import { delete_media_list_from_cache } from "./media/list"
import { delete_media_aggregation_from_cache } from "./media/aggregate"
import { delete_access_token_from_cache } from "./access_token/show"
import { delete_access_token_list_from_cache } from "./access_token/list"
export default {
    status, user, account, hashtag, server, reaction, favorite, media, timeline, access_token,
    delete_status_from_cache, delete_status_favorited_from_cache, delete_status_favorited_by_from_cache,
    delete_status_reaction_from_cache, delete_hashtag_from_cache, delete_server_hashtags_from_cache,
    delete_server_from_cache, delete_user_from_cache, delete_account_favorite_media_from_cache,
    delete_account_favorite_emoji_from_cache, delete_timeline_hashtag_from_cache, delete_timeline_mentions_from_cache,
    delete_timeline_home_from_cache, delete_timeline_server_from_cache, delete_media_list_from_cache,
    delete_access_token_list_from_cache, delete_access_token_from_cache, delete_media_aggregation_from_cache,
    delete_media_from_cache
}