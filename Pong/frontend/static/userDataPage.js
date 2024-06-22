document.addEventListener('DOMContentLoaded', () => {
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
                    const   subDiv = document.createElement('div');
                    const   subDivChild1 = document.createElement('div');
                    const   subDivChild2 = document.createElement('div');

                    subDivChild1.innerHTML = `${data.players[i]}`;
                    subDivChild1.style.textDecoration = "underline";
                    subDivChild1.style.width = "100%";
                    subDivChild1.addEventListener('click', () => {
                        load_stats_page(`${data.players[i]}`);
                    })

                    subDivChild2.innerHTML = `${data.score[i]}`;
                    subDivChild2.style.width = "100%";

                    subDiv.append(subDivChild1, subDivChild2);
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
            .catch (error => {
                // add error message
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
            event.preventDefault();
        }
        else if (element.id === 'statsPage' || element.id === 'profile') {
            fetch('/getUsernameConnected')
            .then(response => response.json())
            .then(username => {
                if (element.id === 'statsPage')
                    load_stats_page(username);
                else
                    load_profile_page(username);
            })
            event.preventDefault();
        }
    })

    const mainPage = document.getElementById('mainPage');
    if (mainPage != null)
        mainPage.addEventListener('click', () => {
            load_main_page();
        });
})

function displayMessage(message, level) {// A ENLEVER QUAND MERGE AVEC FRIEND GESTION
    const messagesContainer = document.getElementById('messagesContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alertSize alert alert-${level}`;
    alertDiv.role = 'alert';
    alertDiv.innerText = message;
    messagesContainer.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function create_div_title(username, str, divName) {
    document.getElementById(divName).innerHTML = "";
    const   title = document.createElement('div');
    title.innerHTML = username + " " + str;

    // Add CSS to created div
    title.className = "title_div gradient-background";
    document.querySelector(`#${divName}`).append(title);
}

function load_stats_page(username) {
    // Hides main page elements and display user stats elements:
    document.getElementById('greetings').style.display = 'none';
    document.getElementById('userDataDiv').style.display = 'none';
    document.getElementById('userDataDiv').innerHTML = "";
    document.getElementById('statsDiv').style.display = 'block';
    document.getElementById('statsDiv').innerHTML = "";

    create_div_title(username, "game stats", "statsDiv");

    // Fetch user stat data + create div element for each data:
    if (document.getElementById('statsDiv').style.display === 'block')
    {
        fetch(`stats/${username}`)
        .then(response => response.json())
        .then(values => {
            console.log(values);
            const stat = document.createElement('div');
            const statElo = document.createElement('div');
            statElo.classList.add("divElo");

            statElo.innerHTML = "Current elo / highest: " + values['elo'] + " / " + values['elo_highest'];
            stat.append(statElo);

            document.querySelector('#statsDiv').append(stat);

            // Create pie chart to display winrate
            const chart = document.createElement('div');
            if (`${values.losses}` == 0 && `${values.wins}` == 0) {
                chart.innerHTML = "Pie chart not available yet!";
                chart.style.textAlign = "center";
                document.querySelector('#statsDiv').append(chart);
            }
            else {
                const pieChart = document.createElement('canvas');
                pieChart.setAttribute('id', 'winratePie');
                chart.style.maxWidth = "100vh";
                chart.style.maxHeight = "100vh";
                chart.style.minWidth = "30vh";
                chart.style.minHeight = "30vh";
                chart.style.margin = "0px auto";
                chart.append(pieChart);
                document.querySelector('#statsDiv').append(chart);

                const winrateData = {
                    labels: [`Defeats (${values.losses})`, `Victories (${values.wins})`],
                    datasets: [{
                        label: "Winrate",
                        data: [`${values.losses}`, `${values.wins}`],
                        backgroundColor: ["rgb(255,99,132)", "rgb(0,128,0)"],
                        borderColor: "black",
                        hoverOffset: 4,
                        pointBorderWidth: 1,
                        pointHoverBorderWidth: 2
                    }]
                };

                new Chart("winratePie", {
                    type: "pie",
                    data: winrateData,
                    options: {
                        title: {
                            display: true,
                            text: `Winrate ${values.winrate}`,
                        },
                    }
                });
            }


            // Create history matchs for current user
            const matchHistory = document.createElement('div');
            matchHistory.classList.add("matchHistoryDiv");

            const header = document.createElement('div');
            header.innerHTML = "Match history";
            header.classList.add("txtSectionDiv");
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
            document.querySelector('#statsDiv').append(matchHistory);
        })
        .catch(error => console.error('Error:', error));
    }
}

function load_main_page() {
    document.getElementById('greetings').style.display = 'block';

    document.getElementById('statsDiv').style.display = 'none';
    document.getElementById('statsDiv').innerHTML = "";
    document.getElementById('userDataDiv').style.display = 'none';
    document.getElementById('userDataDiv').innerHTML = "";
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