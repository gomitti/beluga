import { Component } from "react"
import classnames from "classnames"

export class LoadingButton extends Component {
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
        const { is_loading, is_neutral_color, children } = this.props
        return (
            <button className={classnames("button loading-button", {
                "is-loading": is_loading,
                "neutral": is_neutral_color,
                "user-defined-gradient-bg-color": !is_neutral_color,
                "user-defined-button-box-shadow-color": !is_neutral_color,
            })}
                onTouchStart={this.onTouchStart}
                onTouchMove={this.onTouchMove}
                onTouchCancel={this.onTouchCancel}
                onTouchEnd={this.onTouchEnd}>
                <span className="label">{children}</span>
                <span className="spinner"></span>
            </button>
        )
    }
}

export class Button extends Component {
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