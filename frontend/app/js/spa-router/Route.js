export default class Route {
    constructor(name, path, view, user = null, accept_parameters = false) {
        this.name = name;
        this.path = path;
        this.view = new view();
        this.user = user;
        this.accept_parameters = accept_parameters;
    }

    accept_parameters() {
        return this.accept_parameters;
    }

    setProps(newProps) {
        this.props = newProps;
        this.view.setProps(newProps);
    }

    setUser(user) {
        this.user = user;
        this.view.setUser(user);
    }

    renderView() {
        return this.view.render();
    }

    setupEventListeners() {
        this.view.setupEventListeners();
    }
}
