function handleResponse(response) {
    console.log("validate response - " + JSON.stringify(response));
    if (response.message === 'success') {
        const params = new URLSearchParams(window.location.search);
        const actionParam = params.get("action");
        browser.runtime.sendMessage(
            {
                type: 'action',
                message: actionParam
            }
        );
        window.close();
    } else {
        document.querySelector("#password").classList.add('is-invalid');
    }
}

function handleError(error) {
    console.error('prompt.js received error - ' + error);
}
function validate(e) {
    e.preventDefault();
    const sending = browser.runtime.sendMessage(
        {
            type: 'verifyPassword',
            password: document.querySelector("#password").value
        });
    sending.then(handleResponse, handleError);
}

document.querySelector("form").addEventListener("submit", validate);
document.querySelector("#password").addEventListener("input", e => {
    document.querySelector("#submitPassword").disabled = e.target.value === '';
});
