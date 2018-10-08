import { is_string } from "../assert"
import { ObjectID } from "mongodb"

export const try_convert_to_object_id = (value, message) => {
    if (is_string(value)) {
        try {
            value = ObjectID(value)
        } catch (error) {
            throw new Error(message)
        }
    }
    if (!!(value instanceof ObjectID) === false) {
        throw new Error(message)
    }
    return value
}

export const try_convert_to_hex_string = (value, message) => {
    if (is_string(value)) {
        return value
    }
    if (value instanceof ObjectID) {
        return value.toHexString()
    }
    throw new Error(message)
}

export const convert_to_hex_string_or_null = (value, message) => {
    if (is_string(value)) {
        return value
    }
    if (value instanceof ObjectID) {
        return value.toHexString()
    }
    return null
}