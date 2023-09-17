const clientId = 'df25918a15b042b79566cba94fc18ca6';
const redirectUri = 'spotifymanager.github.io';
const scopes = ['user-read-private', 'user-read-email']; // Add the required scopes

const generateRandomString = length => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
};

const createCodeVerifier = () => {
    const codeVerifier = generateRandomString(128);
    localStorage.setItem('codeVerifier', codeVerifier);
    return codeVerifier;
};

const createCodeChallenge = async (codeVerifier) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return codeChallenge;
};

const initiateLogin = async () => {
    const codeVerifier = createCodeVerifier();
    const codeChallenge = await createCodeChallenge(codeVerifier);

    const state = generateRandomString(32);
    localStorage.setItem('state', state);

    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${scopes.join('%20')}&redirect_uri=${redirectUri}&state=${state}&code_challenge_method=S256&code_challenge=${codeChallenge}`;
    window.location.href = authUrl;
};

document.getElementById('login-button').addEventListener('click', initiateLogin);
