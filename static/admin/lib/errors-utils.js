// eslint-disable-next-line no-unused-vars
const lib_errors = {

    // Extract jqxhr error message
    extractErrorMsgFromResponse: (response) => {
        if (response instanceof Error) return String(response)

        let hasErrorMsg =
            ('error' in response) &&
            (typeof response.error == 'string')

        return hasErrorMsg ? response.error : response.statusText
    },

    // Manage errors
    processError: (error) => {
        const errorMsg = lib_errors.extractErrorMsgFromResponse(error)
        // Redirect to sign in page if authentication error
        if (errorMsg === 'Invalid JSON Web Token' || errorMsg === 'Missing JSON Web Token') {
            lib_auth.logout()
        } else {
            lib_msg.displayErrors(errorMsg)
            console.log(error)
        }
    },

}
