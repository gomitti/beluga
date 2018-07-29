import enums from "../enums"
import assert, { is_object } from "../assert"
import assign from "../libs/assign"

const key = "desktop.settings.BxbFYxIv"

export const update = settings => {
    assert(is_object(settings), "@settings must be of type object")
    const settings_json = JSON.stringify(settings)
    localStorage.setItem(key, settings_json)
}
let settings = {
    "new_column_target": enums.column.target.new,
    "multiple_columns_enabled": false
}
export const default_settings = assign(settings)

// エディタの補完を有効にするためにわざと変な書き方をしている
settings = (() => {
    if (typeof localStorage === "undefined") {
        return default_settings
    }
    const settings_str = localStorage.getItem(key)
    if (!!settings_str == false) {
        return default_settings
    }
    const settings = JSON.parse(settings_str)
    if (typeof settings !== "object") {
        return default_settings
    }
    return Object.assign({}, default_settings, settings)
})()
export default settings