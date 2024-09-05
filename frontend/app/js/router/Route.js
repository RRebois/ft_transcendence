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
        let remove_navbar = false;
        if (this.name === '/purrinha') {
            remove_navbar = true;
        }
        const layout = new Layout(this.view, this.user, remove_navbar);
        return layout.render();
    }

    setupEventListeners() {
        let remove_navbar = false;
        if (this.name === '/purrinha') {
            remove_navbar = true;
        }
        const layout = new Layout(this.view, this.user, remove_navbar);
        layout.setupEventListeners();
    }
}
