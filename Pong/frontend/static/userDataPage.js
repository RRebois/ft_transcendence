document.addEventListener('DOMContentLoaded', ()=>{

    document.getElementById('statsPage').addEventListener('click', () => {
        const user_connected = document.querySelector('#ownUsername').textContent.trim();
        load_stats_page(user_connected);
    })
    document.getElementById('mainPage').addEventListener('click', () => {
        load_main_page();
    })
})

function load_stats_page(username) {
    document.getElementById('divUserStats').innerHTML = username;

    console.log(`${username}`);
    // Hides main page elements and display user stats elements:
    document.getElementById('greetings').style.display = 'none';
    document.getElementById('divUserStats').style.display = 'block';

    // Fetch user stat data + create div element for each data:
    fetch(`stats/${username}`)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        for (const key in data)
            create_div(key, data[key]);
    })
    .catch(error => console.error('Error:', error));

    event.preventDefault();
}

function load_main_page() {
    document.getElementById('greetings').style.display = 'block';
    document.getElementById('divUserStats').style.display = 'none';
}

function create_div(key, value) {
    const   stat = document.createElement('div');
    stat.innerHTML = `${key}: ${value}`;

    document.querySelector('#divUserStats').append(stat);
}
