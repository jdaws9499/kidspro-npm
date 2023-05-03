function handleResponse(response) {
    console.log("store password response - " + JSON.stringify(response));
    if (response.message === 'success') {
        /*const params = new URLSearchParams(window.location.search);
        const actionParam = params.get("action");
        browser.runtime.sendMessage(
            {
                type: 'action',
                message: actionParam
            }
        );*/
        window.close();
    } else {
        document.querySelector("#password").classList.add('is-invalid');
        document.querySelector("#invalidPassword").classList.remove('d-none');
    }
}

function handleError(error) {
    console.error('prompt.js received error - ' + error);
}
function validate(e) {
    e.preventDefault();
    const sending = browser.runtime.sendMessage(
        {
            type: 'storePassword',
            password: document.querySelector("#password").value
        });
    setTimeout(sending.then(handleResponse, handleError), 3000);
}

document.querySelector("form").addEventListener("submit", validate);
document.querySelector("#password").addEventListener("input", e => {
    document.querySelector("#submitPassword").disabled = e.target.value === '';
});
