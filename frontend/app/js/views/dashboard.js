export default class Dashboard {
    constructor(props) {
        this.props = props;
    }

    render() {
        document.title = 'ft_transcendence';
        return `
            <p>
            Hello 👉👈
            </p>
        `;
    }

}