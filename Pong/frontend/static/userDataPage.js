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
        if (element.classList.contains('expander')) {
            const addDiv = document.createElement('div');
            addDiv.setAttribute('id', element.parentElement.id + 'expand');

            // fetch for the scoreboard
            fetch(`match/${element.parentElement.id}`)
            .then(response => response.json())
            .then(data => { // if we do 3v3 and or 4v4 create API to display all games, or only 3v3 or 4v4
                let j = Math.round((100 / data.players.length));
                for (let i = 0; i < data.players.length; i++)
                {
                    const subDiv = document.createElement('div');
                    subDiv.innerHTML = `<a href="" onclick='load_stats_page(${JSON.stringify(data.players[i])})'>
                        ${data.players[i]} </a> <br /> ${data.score[i]}`;
                    if (`${data.players[i]}` === `${data.winner}`) {
                        subDiv.classList.add("matchWonSub");
                        subDiv.style.width = `${j}%`;
                    }
                    else {
                        subDiv.classList.add("matchLostSub");
                        subDiv.style.width = `${j}%`;
                    }
                    addDiv.append(subDiv);
                }
            })

            if (element.classList.contains("shrink"))
            {
                element.className = "fa-solid fa-eye-slash expander";
                element.parentElement.append(addDiv);
            }
            else {
                element.className = "fa-solid fa-eye expander shrink";
                const test = document.getElementById(element.parentElement.id + 'expand')
                test.remove();
            }
        }
        event.preventDefault();
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
            if (matches.length > 0)
                for (let i = 0; i < matches.length; i++)
                    create_div(matches[i], matchHistory, username);
            else {
                const   tmp = document.createElement('div');
                tmp.innerHTML = "No game played yet!"
                matchHistory.append(tmp);
            }

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
    tmp.classList.add("matchDisplay");
    tmp.setAttribute('id', `${match.id}`);

    var txt = `${match.players.length} players game played on ${match.timestamp}.`;
    tmp.innerHTML = txt;

    if (username == `${match.winner}`)
        tmp.classList.add("matchWon");
    else
        tmp.classList.add("matchLost");

//    const eyeDiv = document.createElement('div');
    const eye = document.createElement('div');
//    eyeDiv.classList.add("expander", "shrink");
    eye.className = "fa-solid fa-eye expander shrink";
//    eyeDiv.append(eye);
    tmp.append(eye);
    matchHistory.append(tmp);
}

//for (const key in data)
//        if (key != 'id')
//        {}