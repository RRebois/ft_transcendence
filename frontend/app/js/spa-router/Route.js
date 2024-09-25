export default class Route {
    constructor(name, path, view, user = null, nb_parameters = 0) {
        this.name = name;
        this.path = path;
        this.view = new view();
        this.user = user;
        this.nb_parameters = nb_parameters;
    }

    parameters() {
        return this.nb_parameters;
    }

    setProps(newProps) {
        this.props = newProps;
        this.view.setProps(newProps);
    }

    setUser(user) {
        this.user = user;
        this.view.setUser(user);
    }

    renderView(path) {
        return this.view.render();
    }

    setupEventListeners(path) {
        this.view.setupEventListeners();
    }
}
