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

    removeUser() {
        this.user = null;
        this.view.removeUser();
    }

    renderView() {
        return this.view.render();
    }

    setupEventListeners() {
        this.view.setupEventListeners();
    }
}
