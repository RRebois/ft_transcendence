import {isUserConnected} from "@js/functions/user_auth.js";
import Layout from "@js/Layout.js";

export default class Route {
    constructor(name, path, view, user = null) {
        this.name = name;
        this.path = path;
        this.view = view;
        this.user = user;
    }

    setProps(newProps) {
        this.props = newProps;
    }

    setUser(user) {
        this.user = user;
    }

    renderView() {
        const layout = new Layout(this.view, this.user);
        return layout.render();
        // return new this.view({ ...this.props, user: this.user }).render();
    }

    setupEventListeners() {
        // return new this.view({ ...this.props, user: this.user }).setupEventListeners();
        const layout = new Layout(this.view, this.user);
        layout.setupEventListeners();
    }
}
