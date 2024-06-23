document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', event => {
        const element = event.target;
        if (element.classList.contains('expander')) {
            const addDiv = document.createElement('div');
            setAttributes(addDiv, {'id': element.parentElement.id + 'expand'});

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

function setAttributes(el, attrs) {
  for(var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
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

    // Create radio button groups to display both game data or pong data or purrinha data
    const   radioDiv = document.createElement('div');
    radioDiv.style.textAlign = 'center';
    const   radioSubDiv1 = document.createElement('div');
    const   radioSubDiv2 = document.createElement('div');
    const   radioSubDiv3 = document.createElement('div');
    radioSubDiv1.className = "form-check form-check-inline";
    radioSubDiv2.className = "form-check form-check-inline";
    radioSubDiv3.className = "form-check form-check-inline";

    const   radioInput1 = document.createElement('input');
    const   radioInput2 = document.createElement('input');
    const   radioInput3 = document.createElement('input');
    setAttributes(radioInput1, {'class': 'form-check-input', 'type': 'checkbox', 'name': 'radiobtn', 'id': 'radio1', 'value': 'pong'});
    setAttributes(radioInput2, {'class': 'form-check-input', 'type': 'checkbox', 'name': 'radiobtn', 'id': 'radio2', 'value': 'all'});
    radioInput2.checked = true;
    setAttributes(radioInput3, {'class': 'form-check-input', 'type': 'checkbox', 'name': 'radiobtn', 'id': 'radio3', 'value': 'purrinha'});

    const   radioLabel1 = document.createElement('label');
    const   radioLabel2 = document.createElement('label');
    const   radioLabel3 = document.createElement('label');
    setAttributes(radioLabel1, {'class': 'form-check-label', 'for': 'radio1'});
    radioLabel1.textContent = "Pong stats";
    setAttributes(radioLabel2, {'class': 'form-check-label', 'for': 'radio2'});
    radioLabel2.textContent = "Both games stats";
    setAttributes(radioLabel3, {'class': 'form-check-label', 'for': 'radio3'});
    radioLabel3.textContent = "Purrinha stats";

    radioSubDiv1.append(radioInput1, radioLabel1);
    radioSubDiv2.append(radioInput2, radioLabel2);
    radioSubDiv3.append(radioInput3, radioLabel3);
    radioDiv.append(radioSubDiv1, radioSubDiv2, radioSubDiv3);
    document.querySelector('#statsDiv').append(radioDiv);

    // Fetch user stat data + create div element for each data:
    if (document.getElementById('statsDiv').style.display === 'block')
    {
        if (radioInput1.checked == false && radioInput2.checked == false && radioInput3.checked == false) {
            const   tipDiv = document.createElement('div');
            setAttributes(tipDiv, {'id': 'tipDiv'});
            tipDiv.innerHTML = "Select one of the three checkboxes above to see the detailed information of your stats.";
            document.querySelector('#statsDiv').append(tipDiv);

            // Remove stats if present
            const   divDisplayStats = document.querySelectorAll('displayStats');
            if (divDisplayStats != null)
                console.log('hi');
                // TODO
        }
        else {
            const   rmTip = document.getElementById('tipDiv');
            if (rmTip != null)
                rmTip.remove();

            // Display main div with data of both games
            fetch(`stats/${username}`)
            .then(response => response.json())
            .then(values => {
                console.log(values);

                const   statMainDiv = document.createElement('div');
                const   stat = document.createElement('div');
                const   statEloPong = document.createElement('div');
                const   statEloPurr = document.createElement('div');
                statEloPong.classList.add("divElo");
                statEloPurr.classList.add("divElo");

                statEloPong.innerHTML = "Pong current elo / highest: " + values['elo_pong'] + " / " + values['elo_highest'][0];
                statEloPurr.innerHTML = "Purrinha current elo / highest: " + values['elo_purrinha'] + " / " + values['elo_highest'][1];
                stat.append(statEloPong, statEloPurr);

                statMainDiv.append(stat);

                // Create pie chart to display winrate
                const chart = document.createElement('div');
                if (values[losses][0] == 0 && values[losses][1] == 0)
                    && values[wins][0] == 0 && values[wins][1] == 0{
                    chart.innerHTML = "Pie chart not available yet!";
                    chart.style.textAlign = "center";
                    statMainDiv.append(chart);
                }
                else {
                    const pieChart = document.createElement('canvas');
                    setAttributes(pieChart, {'id': 'winratePie'});
                    chart.style.maxWidth = "100vh";
                    chart.style.maxHeight = "100vh";
                    chart.style.minWidth = "30vh";
                    chart.style.minHeight = "30vh";
                    chart.style.margin = "0px auto";
                    chart.append(pieChart);
                    statMainDiv.append(chart);

                    const winrateData = {
                        labels: [`Defeats (${values.losses})` , `Victories (${values.wins})`],
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
                statMainDiv.append(matchHistory);
                document.querySelector('#statsDiv').append(statMainDiv);
            })
            .catch(error => console.error('Error:', error));
        }
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
    setAttributes(tmp, {'id': `${match.id}`});

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