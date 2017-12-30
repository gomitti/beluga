import { observable, action, computed } from "mobx";
import { request } from "../api"

export default class StatusStore {
	@observable likes = 0

	constructor() {
		this.text = ""
		this.userName = ""
		this.createdAt = 0
	}

	@action.bound
	incrementLikes(){
		this.likes += 1
	}

}