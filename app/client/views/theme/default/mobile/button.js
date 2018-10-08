import { Component } from "react"

export default class Button extends Component {
    onTouchStart = event => {
        this.touched = true
    }
    onTouchCancel = event => {
        this.touched = false
    }
    onTouchMove = event => {
        this.touched = false
    }
    onTouchEnd = event => {
        if (this.touched !== true) {
            return
        }
        const { onClick } = this.props
        if (onClick) {
            onClick(event)
        }
    }
    render() {
        const { children, className } = this.props
        return (
            <button
                className={className}
                onTouchStart={this.onTouchStart}
                onTouchMove={this.onTouchMove}
                onTouchCancel={this.onTouchCancel}
                onTouchEnd={this.onTouchEnd}
            >{children}</button>
        )
    }
}