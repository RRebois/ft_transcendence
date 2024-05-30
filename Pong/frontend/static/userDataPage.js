document.addEventListener('DOMContentLoaded', ()=>{

    document.querySelector("#ownUsername").addEventListener('click', () =>{
        const user_connected = document.getElementById('ownUsername').textContent;
        fetch(`stats/${user_connected}`)
        .then(data => {
//            document.getElementById('greetings').style.display = 'none';
//            document.getElementById('divData')..style.display = 'block';
            console.log(data);
        });

    })
})
