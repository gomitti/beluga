export const enum_column_type = {
	"server": Symbol(),
	"home": Symbol(),
	"hashtag": Symbol(),
}
export const enum_column_target = {
	"self": Symbol(),
	"new": Symbol(),
	"blank": Symbol(),
}
export default (() => {
	const default_settings = {
		"column": {
			"target": enum_column_target.new
		}
	}
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
	return Object.assign(default_settings, settings)
})()