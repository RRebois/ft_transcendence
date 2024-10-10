export const remove_modal_backdrops = () => {
    const modalBackdrops = document.getElementsByClassName('modal-backdrop');
    if (modalBackdrops.length > 0) {
        for (let i = 0; i < modalBackdrops.length; i++) {
            modalBackdrops[i].remove();
        }
    }
}

export const saveFontSize = (size) => {
    localStorage.setItem('fontSize', size);
}

export const applyFontSize = () => {
    console.log('applying font size');
    const size = localStorage.getItem('fontSize') || 'md';
    console.log('font size: ', size);
    changeFontSize(size);
}

export const changeFontSize = (size) => {
    console.log('selected font size: ', size);
    let textSize = '';
    let titleSize = '';
    let subtitleSize = '';
    let clueSize = '';
    let ctaSize = '';
    switch (size) {
        case 'sm':
            titleSize = "calc(1.3rem + 0.6vw)";         // fs-3
            subtitleSize = "1rem";                      // fs-6
            textSize = "0.875rem";
            clueSize = "0.75rem";
            ctaSize = "1.25rem";                        // fs-5
            break;
        case 'md':
            titleSize = "calc(1.325rem + 0.9vw)";       // fs-2
            subtitleSize = "1.25rem";                   // fs-5
            textSize = "1rem";
            clueSize = "0.875rem";
            ctaSize = "calc(1.275rem + 0.3vw)"          // fs-4
            break;
        case 'lg':
            titleSize = "calc(1.375rem + 1.5vw)";       // fs-1
            subtitleSize = "calc(1.275rem + 0.3vw)";    // fs-4
            textSize = "1.125rem;";
            clueSize = "1rem";
            ctaSize = "calc(1.3rem + 0.6vw)";           // fs-3
            break;
        default:
            titleSize = "calc(1.325rem + 0.9vw)";       // fs-2
            subtitleSize = "1.25rem";                   // fs-5
            textSize = "1rem";
            clueSize = "0.875rem";
            ctaSize = "calc(1.275rem + 0.3vw)"          // fs-4
            break;
    }

    saveFontSize(size);

    document.querySelectorAll('.text').forEach((element) => {
        element.style.fontSize = textSize;
    });

    document.querySelectorAll('.title').forEach((element) => {
        element.style.fontSize = titleSize;
    });

    document.querySelectorAll('.subtitle').forEach((element) => {
        element.style.fontSize = subtitleSize;
    });

    document.querySelectorAll('.clue-text').forEach((element) => {
        element.style.fontSize = clueSize;
    });

    document.querySelectorAll('.cta-text').forEach((element) => {
        element.style.fontSize = ctaSize;
    });

    document.querySelectorAll('.form-control').forEach((element) => {
        element.classList.remove('form-control-lg');
        element.classList.remove('form-control-sm');
        if (size !== 'md') {
            element.classList.add('form-control-' + size);
        }
    });

    document.querySelectorAll('.form-select').forEach((element) => {
        element.classList.remove('form-select-lg');
        element.classList.remove('form-select-sm');
        if (size !== 'md') {
            element.classList.add('form-select-' + size);
        }
    });

    document.querySelectorAll('.btn').forEach((element) => {
        element.classList.remove('btn-lg');
        element.classList.remove('btn-sm');
        if (size !== 'md') {
            element.classList.add('btn-' + size);
        }
    });

}
