document.addEventListener('DOMContentLoaded', ()=>{

//    document.getElementById('statsPage').addEventListener('click', () => {
//        const user_connected = document.querySelector('#ownUsername').textContent.trim();
//        load_stats_page(user_connected);
//    })

    document.getElementById('profile').addEventListener('click', () => {
        const user_connected = document.querySelector('#ownUsername').textContent.trim();
        load_profile_page(user_connected);
    });

    document.addEventListener('click', event => {
        const element = event.target;
        if (element.className.contains('matchDisplay') {
            const addDiv = document.createElement('div');
            addDiv.innerHTML = "clicked!";
            element.append(addDiv);

            if (element.classList.contains("shrink"))
            {
                element.classList.remove("shrink");
                element.classList.add("expand");
                addDiv.style.display = "block";
            }
            else {
                element.classList.add("shrink");
                element.classList.remove("expand");
                addDiv.style.display = "none";
            }
        }
    });

    document.getElementById('mainPage').addEventListener('click', () => {
        load_main_page();
    });
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


        const matchHistory = document.createElement('div');
        matchHistory.classList.add("matchHistoryDiv");

        const header = document.createElement('div');
        header.innerHTML = "Match history";
        header.classList.add("headerMatchHistory");
        matchHistory.append(header);

        fetch(`matchs/${username}`)
        .then(response => response.json())
        .then(matches => {
            console.log(matches);
            for (let i = 0; i < matches.length; i++)
                create_div(matches[i], matchHistory, username);
        })
        document.querySelector('#divUserStats').append(matchHistory);
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

function create_div(match, matchHistory, username) {
    const   tmp = document.createElement('div');
    tmp.classList.add("matchDisplay", "shrink");
    tmp.setAttribute('id', `${match.id}`);
    var     txt = "";
    let     i = 0;

    for (i; i < match.players.length - 1; i++)
        txt += `${match.players[i]} VS `;
    txt += `${match.players[i]}`;
    tmp.innerHTML = txt;

    if (username == `${match.winner}`)
        tmp.classList.add("matchWon");
    else
        tmp.classList.add("matchLost");
    matchHistory.append(tmp);
}

//for (const key in data)
//        if (key != 'id')
//        {}