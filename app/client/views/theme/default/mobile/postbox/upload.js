import { Component } from "react"
import { observer } from "mobx-react"
import { convert_bytes_to_optimal_unit } from "../../../../../libs/functions";

@observer
export default class ProgressView extends Component {
    render() {
        const { metadatas } = this.props
        if (metadatas.length === 0) {
            return null
        }
        return (
            <div className="postbox-upload-progress">
                {metadatas.map(metadata => {
                    const { name, size, percent } = metadata
                    const size_str = convert_bytes_to_optimal_unit(size)
                    return (
                        <div className="file">
                            <p className="metadata">
                                <span className="name">{name}</span>
                                <span className="size">{size_str}</span>
                            </p>
                            <p className="progress-bar">
                                <span className="bar user-defined-bg-color" style={{ "width": `${percent * 100}%` }}></span>
                                <span className="track"></span>
                            </p>
                        </div>
                    )
                })}
            </div>
        )
    }
}