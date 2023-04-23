const form = document.querySelector("form")
const keyInput = document.querySelector("#key")
const secretInput = document.querySelector("#secret")
const submitData = document.querySelector("#submitdata")
const saveStatus = document.querySelector("#savestatus")
const isVerified = document.querySelector("#isverified")

/* Handles errors/success to notify user. */

function displayMessage(status, property) {
    if (status instanceof Error) {
        console.error(status)
        saveStatus.textContent = `${property} could not save`
    }
    else {
        saveStatus.textContent = `${property} saved successfully`
    }
    saveStatus.style.display = "block"
}

/* Prevents unwanted standard form behavior. */

form.addEventListener("submit", (e) => e.preventDefault())

/* Saves key/secret values to local storage */

submitData.addEventListener("click", (e) => {
    const isKeySaved = browser.storage.local.set({"key": keyInput.value}).catch((error) => {
        displayMessage(error, "Key")
        throw new Error()
    })
    const isSecretSaved = browser.storage.local.set({"secret": secretInput.value}).catch((error) => {
        displayMessage(error, "Secret")
        throw new Error()
    })

    Promise.all([isKeySaved, isSecretSaved])
        .then((p) => {
            displayMessage(p, "API Key and Secret")
        })
        /* Used to kill fake error */
        .catch((error) => error)
    browser.runtime.sendMessage({type: "api", params: {method: "GET"}, url: `https://api.schoology.com/v1/app-user-info`})
        .then((data) => {
            isVerified.textContent = "API Verification Succeeded"
            return data;
        })
        .catch((error) => {
            console.error(`Verfication error: ${error}`)
            isVerified.textContent = "API Verfication Failed! (maybe entered information wrong?)"
        })
    isVerified.setAttribute("style", "display: unset;")
})

/*
Retrieves stored API key/secret and fills the respective <input> elements.
*/

browser.storage.local.get()
    .then((storedData) => {
        keyInput.value = storedData["key"]
        secretInput.value = storedData["secret"]
    });


