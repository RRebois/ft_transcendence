import Navbar from "@js/components/Navbar.js";

export default class Layout {
    constructor(view, user = null) {
        this.view = view;
        this.user = user;
    }

    render() {
        let navbar = null;
        if (this.user) {
            navbar = new Navbar(this.user);
        }
        const view = new this.view({user: this.user});
        if (this.user) {
            return `
                ${navbar.render()}
                ${view.render()}
            `;
        } else {
            return `
                ${view.render()}
            `;
        }
    }

    setupEventListeners() {
        if (this.user) {
            const navbar = new Navbar(this.user);
            navbar.setupEventListeners();
        }
        const view = new this.view({user: this.user});
        if (typeof view.setupEventListeners === 'function') {
            view.setupEventListeners();
        }
    }
}
