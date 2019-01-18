"use strict";

if (typeof window === "undefined") {
    const observable = (prototype, name, descriptor) => {
        if (name && descriptor) {
            Object.defineProperty(prototype, name, descriptor)
            return
        }
        return prototype
    }
    observable.shallow = (prototype, name, descriptor) => {
        Object.defineProperty(prototype, name, descriptor)
    }
    exports.observable = observable
    exports.observer = value => {
        return value
    }
    exports.action = {
        "bound": (prototype, name, descriptor) => {
            Object.defineProperty(prototype, name, descriptor)
        }
    }
} else {
    const { observable, action } = require("mobx")
    const { observer } = require("mobx-react")
    action.bound
    exports.action = action
    exports.observable = observable
    exports.observer = observer
}
