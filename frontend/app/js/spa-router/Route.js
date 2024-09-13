export default class Route {
    constructor(name, path, view, user = null) {
        this.name = name;
        this.path = path;
        this.view = new view();
        this.user = user;
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
