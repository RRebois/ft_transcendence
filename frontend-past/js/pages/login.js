export function LoginPage() {
    return `
        <form id='login-form'>
            <input type='text' name='username' placeholder='Username' />
            <input type='password' name='password' placeholder='Password' />
            <button type='submit'>Login</button>
        </form>
    `;
}