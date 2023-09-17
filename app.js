const clientId = 'df25918a15b042b79566cba94fc18ca6';
const redirectUri = 'https://spotifymanager.github.io';
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

const getAccessToken = async (code) => {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const data = {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
    };

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(data),
    });

    const tokenData = await response.json();
    return tokenData.access_token;
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
const handleCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (state !== localStorage.getItem('state')) {
        console.error('State mismatch. Possible CSRF attack.');
        return;
    }
    
    const codeVerifier = localStorage.getItem('codeVerifier');
    
    // Exchange the authorization code for an access token
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const data = {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
    
    const accessToken = await getAccessToken(code);
    };

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(data),
    });

    const tokenData = await response.json();
    
    // Use the access token and refresh token as needed
    console.log('Access Token:', tokenData.access_token);
    console.log('Refresh Token:', tokenData.refresh_token);
    
    // Clear codeVerifier and state from local storage
    localStorage.removeItem('codeVerifier');
    localStorage.removeItem('state');
};

// Check if the URL contains the code parameter
if (window.location.search.includes('code')) {
    handleCallback();
}

const searchForSongs = async (query) => {
    const accessToken = await getAccessToken(); // Get the access token

    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=5`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    });

    const data = await response.json();
    return data.tracks.items;
};

document.getElementById('search-button').addEventListener('click', async () => {
    const query = document.getElementById('search-input').value;
    const resultsContainer = document.getElementById('results');

    const tracks = await searchForSongs(query);

    // Display search results
    resultsContainer.innerHTML = '';
    tracks.forEach(track => {
        const trackElement = document.createElement('div');
        trackElement.innerText = `${track.name} by ${track.artists[0].name}`;
        resultsContainer.appendChild(trackElement);
    });
});
