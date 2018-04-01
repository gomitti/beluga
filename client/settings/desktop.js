import enums from "../enums"
import assert, { is_object } from "../assert"
import assign from "../libs/assign"

export const update = settings => {
    assert(is_object(settings), "@settings must be of type object")
    settings.column.target = settings.column.target.toString()
    const settings_json = JSON.stringify(settings)
    localStorage.setItem("desktop.settings", settings_json)
}
let settings = {
    "column": {
        "target": enums.column.target.new
    }
}
export const default_settings = assign(settings)

// エディタの補完を有効にするためにわざと変な書き方をしている
settings = (() => {
    if (typeof localStorage === "undefined") {
        return default_settings
    }
    const settings_str = localStorage.getItem("desktop.settings")
    if (!settings_str) {
        return default_settings
    }
    const settings = JSON.parse(settings_str)
    if (typeof settings !== "object") {
        return default_settings
    }
    return Object.assign({}, default_settings, settings)
})()
export default settings