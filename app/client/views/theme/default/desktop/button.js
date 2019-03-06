import classnames from "classnames"

export const LoadingButton = ({ is_loading, handle_click, label, is_neutral_color }) => {
    return (
        <button className={classnames("button loading-button", {
            "is-loading": is_loading,
            "neutral": is_neutral_color,
            "user-defined-gradient-bg-color": !is_neutral_color,
            "user-defined-button-box-shadow-color": !is_neutral_color,
        })} onClick={handle_click}>
            <span className="label">{label}</span>
            <span className="spinner"></span>
        </button>
    )
}