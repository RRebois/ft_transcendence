document.addEventListener('DOMContentLoaded', ()=>{

    document.getElementById('statsPage').addEventListener('click', () => {
        const user_connected = document.querySelector('#ownUsername').textContent.trim();
        load_stats_page(user_connected);
    })

    document.getElementById('profile').addEventListener('click', () => {
        const user_connected = document.querySelector('#ownUsername').textContent.trim();
        load_profile_page(user_connected);
    })

    document.getElementById('mainPage').addEventListener('click', () => {
        load_main_page();
    })
})

function create_div_title(username, str, divName) {
    document.getElementById(divName).innerHTML = "";
    const   title = document.createElement('div');
    title.innerHTML = username + " " + str;

    // Add CSS to created div
    title.classList.add("title_div")
    document.querySelector(`#${divName}`).append(title);
}

function load_stats_page(username) {
    create_div_title(username, "game stats", "divUserStats");

    // Hides main page elements and display user stats elements:
    document.getElementById('greetings').style.display = 'none';
    document.getElementById('divProfile').style.display = 'none';
    document.getElementById('divUserStats').style.display = 'block';

    // Fetch user stat data + create div element for each data:
    fetch(`stats/${username}`)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        const stat = document.createElement('div');
        const statElo = document.createElement('div');
        statElo.classList.add("divElo");

        statElo.innerHTML = "Current elo / highest: " + data['elo'] + " / " + data['elo_highest'];
        stat.append(statElo);

        document.querySelector('#divUserStats').append(stat);

    })
    .catch(error => console.error('Error:', error));

    event.preventDefault();
}


function load_profile_page(username)
{
    document.getElementById('greetings').style.display = 'none';
    document.getElementById('divUserStats').style.display = 'none';
    document.getElementById('divUserStats').innerHTML = "";

    document.getElementById('divProfile').style.display = 'block';

    create_div_title(username, "profile", "divProfile");

    // Fetch user data:
//    fetch(``) api route not created

    event.preventDefault();
}

function load_main_page() {
    document.getElementById('greetings').style.display = 'block';

    document.getElementById('divUserStats').style.display = 'none';
    document.getElementById('divUserStats').innerHTML = "";
    document.getElementById('divProfile').style.display = 'none';
    document.getElementById('divProfile').innerHTML = "";
}

function create_div(key, value) {
    const   stat = document.createElement('div');
    stat.innerHTML = `${key}: ${value}`;

    document.querySelector('#divUserStats').append(stat);
}

//for (const key in data)
//        if (key != 'id')
//        {}