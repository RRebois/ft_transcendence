import {Toast} from "bootstrap/js/index.esm.js";

export default class ToastComponent {
    constructor() {
        this.toastContainer = document.getElementById('toast-container');
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            this.toastContainer.classList.add('toast-container', 'position-fixed', 'bottom-0', 'end-0', 'z-3');
            document.body.appendChild(this.toastContainer);
        }
    }

    getHeaderStyle(type) {
        switch (type) {
            case 'error':
                return 'bg-danger text-white';
            case 'success':
                return 'bg-success text-white';
            default:
                return 'bg-primary text-white';
        }
    }

    getIcon(type) {
        switch (type) {
            case 'error':
                return '<i class="bi bi-exclamation-octagon me-2"></i>';
            default:
                return '<i class="bi bi-info-lg me-2"></i>';
        }
    }

    throwToast(title, message, timeout = 10000, type) {
        const toastId = `toast-${Date.now()}`;
        const headerStyle = this.getHeaderStyle(type);
        const icon = this.getIcon(type);
        const toast = `
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="${timeout}">
                <div class="toast-header ${headerStyle}">
                    ${icon}
                    <strong class="me-auto">${title}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        this.toastContainer.insertAdjacentHTML('beforeend', toast);
        const toastElement = document.getElementById(toastId);
        const bsToast = new Toast(toastElement);
        bsToast.show();
    }
}
