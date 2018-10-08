import enums from "../enums"
import assign from "../libs/assign";

export const default_settings = {
    "new_column_target": enums.column.target.new,
    "multiple_columns_enabled": false
}

let current_settings = assign(default_settings)
export const get_current_settings = () => {
    return current_settings
}

export const update_current_settings = settings => {
    current_settings = assign(default_settings, settings)
}