document.addEventListener('DOMContentLoaded', ()=>{
    document.getElementById('profile').addEventListener('click', () => {
        const user_connected = document.querySelector('#ownUsername').textContent.trim();
        load_profile_page(user_connected);
    });
}