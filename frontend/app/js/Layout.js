import Navbar from "@js/components/Navbar.js";

export default class Layout {
    constructor(view, user = null, remove_navbar = false) {
        this.view = view;
        this.user = user;
        this.remove_navbar = remove_navbar;
    }

    render() {
        let navbar = null;
        if (this.user) {
            navbar = new Navbar(this.user);
        }
        const view = new this.view({user: this.user});
        if (this.user) {
            if (this.remove_navbar) {
                return `
                    ${view.render()}
                `;
            }
            else {
                return `
                    ${navbar.render()}
                    ${view.render()}
                `;
            }
        } else {
            return `
                ${view.render()}
            `;
        }
    }

    setupEventListeners() {
        if (!this.remove_navbar && this.user) {
            const navbar = new Navbar(this.user);
            navbar.setupEventListeners();
        }
        const view = new this.view({user: this.user});
        if (typeof view.setupEventListeners === 'function') {
            view.setupEventListeners();
        }
    }
}
