export default class Route {
    constructor(name, path, view, user = null) {
        this.name = name;
        this.path = path;
        this.view = new view();
        this.user = user;
    }

    setProps(newProps) {
        this.props = newProps;
    }

    setUser(user) {
        console.log("user given to route ", this.name, user)
        this.user = user;

        this.view.setUser(user);
    }

    renderView(path) {
        return this.view.render(path);
    }

    setupEventListeners(path) {
        this.view.setupEventListeners(path);
    }
}
