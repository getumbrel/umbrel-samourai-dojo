/*
 * Signin
 */
function login() {
    let apiKey = document.querySelector('#apikey').value
    let dataJson = {
        'apikey': apiKey
    }

    // Checks input fields
    if (!apiKey) {
        lib_msg.displayErrors('Admin key is mandatory')
        return
    }

    lib_msg.displayMessage('Processing...')

    let deferred = lib_api.signin(dataJson)
    deferred.then(
        (result) => {
            const auth = result.authorizations
            const accessToken = auth.access_token
            if (lib_auth.isAdmin(accessToken)) {
                lib_auth.setAccessToken(accessToken)
                const refreshToken = auth.refresh_token
                lib_auth.setRefreshToken(refreshToken)
                sessionStorage.setItem('activeTab', '')
                lib_msg.displayInfo('Successfully connected to your backend')
                // Redirection to default page
                lib_cmn.goToDefaultPage()
            } else {
                lib_msg.displayErrors('You must sign in with the admin key')
            }
        },
        (error) => {
            lib_errors.processError(error)
        }
    )
}

(() => {
    // Dynamic loading of html and scripts
    lib_cmn.includeHTML()
    // Sets the event handlers
    document.querySelector('#apikey').addEventListener('keyup', (evt) => {
        if (evt.key === 'Enter') {
            login()
        }
    })
    document.querySelector('#signin').addEventListener('click', () => {
        login()
    })
})()
