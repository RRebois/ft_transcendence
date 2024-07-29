export default class Dashboard {
    constructor(props) {
        this.props = props;
        console.log('Dashboard props:', this.props);
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
