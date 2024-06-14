document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(event) {
        const element = event.target;
        ;
    }
}

function load_friends_page() {
    fetch('friends')
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
}