const fetchWebApi = async (endpoint, method, accessToken, body) => {
    const res = await fetch(`https://api.spotify.com/${endpoint}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        method,
        body:JSON.stringify(body)
    });
    return await res.json();
}

export default fetchWebApi;
