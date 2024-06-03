document.addEventListener('DOMContentLoaded', ()=>{

    document.querySelector("#statsPage").addEventListener('onClick', () =>{
        const user_connected = document.getElementById('ownUsername').textContent;
        fetch(`stats/${user_connected}`)
        .then(response => response.json())
        .then(data => {
        for value in data:
            create_div(value);
//            document.getElementById('greetings').style.display = 'none';
//            document.getElementById('divData').style.display = 'block';
//            console.log(data);
        });

    })
})

function load_stats_page(username) {
    
}

function create_div(value) {
    const   stat = document.createElement('div');
    stat.innerHTML = value;

    document.querySelector('#divUserStats').append(stat);

}
