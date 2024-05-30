document.addEventListener('DOMContentLoaded', ()=>{

    document.querySelector("#username").addEventListener('click', () =>{
        document.querySelector('#greetings').innerHTML = "User stats"
    });
})