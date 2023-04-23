//generates Oauth Nonce - requires random string
var randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

//gets current unix timestamp in seconds
function getUnixTimestampInSecondsString() {
    return Math.floor(Date.now() / 1000).toString();
}

//checks HTTP response code to check for possible errors
function checkStatus(response) {
    if (response.ok) {
        return Promise.resolve(response);
    }
    else {
        return Promise.reject(new Error(`HTTP Error: "${response.status} ${response.statusText}"`));
    }
}
//converts Response data stream into Javascript Object - not json
function parseJSON(response) {
    return response.json();
}

//logs response to console
function logResponse(response) {
    console.log(response);
}

/*
Generates OAuth1.0 2 Legged Header
*/

async function oauthHeader() {
    const random = randomString(16);
    const timestamp = getUnixTimestampInSecondsString();
    const storedData = await browser.storage.local.get();
    let result = "";
    const authorization = {
        "OAuth realm": '"Schoology API"',
        "oauth_consumer_key": `"${storedData["key"]}"`,
        "oauth_token": '""',
        "oauth_nonce": `"${random}"`,
        "oauth_timestamp": `"${timestamp}"`,
        "oauth_signature_method": '"PLAINTEXT"',
        "oauth_version": '"1.0"',
        "oauth_signature": `"${storedData["secret"]}%26"`
    };
    Object.keys(authorization).forEach((i) => {
    if (i == "oauth_signature") {
        result += `${i}=${authorization[i]}`;
    }
    else {
        result += `${i}=${authorization[i]}, `;
    }
    });
    return result;
}

async function schoologyAPIRequest(url, method) {
    const auth = await oauthHeader();
    const request = new Request(url, {
        method: method,
        headers: {
            "Authorization": auth,
            "Accept": "text/xml;q=0.0,application/json;q=1.0",
            "Host": "api.schoology.com",
            "Content-Type": "application/json"
        },
    });

    return fetch(request)
        .then(checkStatus)
        .then(parseJSON)
        .then((data) => {
            return data;
        }).catch((error) => {
            return Promise.reject(error)
        });
}

browser.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type === "api") {
            return schoologyAPIRequest(request.url, request.params.method);
        }
    }
);