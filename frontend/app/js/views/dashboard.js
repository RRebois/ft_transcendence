export default class Dashboard {
    constructor(props) {
        this.props = props;
    }

    setupEventListeners() {}

    render() {
        document.title = 'ft_transcendence';
        return `
            <p>
            Hello 👉👈
            </p>
        `;
    }

}