import enums from "../enums"
import assign from "../libs/assign"
import assert, { is_object } from "../assert"

class DesktopSettings {
    constructor(settings) {
        this.new_column_target = enums.column.target.blank
        this.multiple_columns_enabled = false
        if (settings && is_object(settings)) {
            for (const key in settings) {
                if (this.hasOwnProperty(key)) {
                    this[key] = settings[key]
                }
            }
        }
    }
}

let current_settings = null

export const get = () => {
    return current_settings
}

export const init = settings => {
    current_settings = new DesktopSettings(settings)
}