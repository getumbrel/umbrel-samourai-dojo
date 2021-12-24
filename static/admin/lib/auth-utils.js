// eslint-disable-next-line no-unused-vars
const lib_auth = {

    /* SessionStorage Key used for access token */
    SESSION_STORE_ACCESS_TOKEN: 'access_token',

    /* SessionStorage Key used for the timestamp of the access token */
    SESSION_STORE_ACCESS_TOKEN_TS: 'access_token_ts',

    /* SessionStorage Key used for refresh token */
    SESSION_STORE_REFRESH_TOKEN: 'refresh_token',

    /* SessionStorage Key used for the timestamp of the refresh token */
    SESSION_STORE_REFRESH_TOKEN_TS: 'refresh_token_ts',

    /* JWT Scheme */
    JWT_SCHEME: 'Bearer',

    /* Admin profile */
    TOKEN_PROFILE_ADMIN: 'admin',


    /*
     * Retrieves access token from session storage
     */
    getAccessToken: () => sessionStorage.getItem(lib_auth.SESSION_STORE_ACCESS_TOKEN),

    /*
     * Stores access token in session storage
     */
    setAccessToken: (token) => {
        const now = new Date()
        sessionStorage.setItem(lib_auth.SESSION_STORE_ACCESS_TOKEN_TS, now.getTime())
        sessionStorage.setItem(lib_auth.SESSION_STORE_ACCESS_TOKEN, token)
    },

    /*
     * Retrieves refresh token from session storage
     */
    getRefreshToken: () => sessionStorage.getItem(lib_auth.SESSION_STORE_REFRESH_TOKEN),

    /*
     * Stores refresh token in session storage
     */
    setRefreshToken: (token) => {
        const now = new Date()
        sessionStorage.setItem(lib_auth.SESSION_STORE_REFRESH_TOKEN_TS, now.getTime())
        sessionStorage.setItem(lib_auth.SESSION_STORE_REFRESH_TOKEN, token)
    },

    /*
     * Refreshes the access token
     */
    refreshAccessToken: () => {
        if (!lib_auth.isAuthenticated()) {
            return
        }

        const now = new Date()
        const atts = sessionStorage.getItem(lib_auth.SESSION_STORE_ACCESS_TOKEN_TS)
        let timeElapsed = (now.getTime() - atts) / 1000

        // Refresh the access token if more than 5mn
        if (timeElapsed > 300) {
            // Check if refresh token has expired or is about to expire
            const rtts = sessionStorage.getItem(lib_auth.SESSION_STORE_REFRESH_TOKEN_TS)
            if ((now.getTime() - rtts) / 1000 > 7200 - 60) {
                // Force user to sign in again
                lib_auth.logout()
                return
            }

            let deferred = lib_api.refreshToken({
                'rt': lib_auth.getRefreshToken()
            })

            deferred.then(
                (result) => {
                    const auth = result.authorizations
                    const accessToken = auth.access_token
                    lib_auth.setAccessToken(accessToken)
                },
                () => {
                    // Do nothing
                }
            )
        }
    },

    /*
     * Checks if user is authenticated
     */
    isAuthenticated: () => {
        // Checks that an access token is stored in session storage
        let token = lib_auth.getAccessToken()
        return Boolean(token && (token !== 'null'))
    },

    /*
     * Extract the payload of an access token
     * in json format
     */
    getPayloadAccessToken: token => {
        if (!token)
            token = lib_auth.getAccessToken()

        if (!token)
            return null

        try {
            const payloadBase64 = token.split('.')[1]
            const payloadUtf8 = atob(payloadBase64)
            return JSON.parse(payloadUtf8)
        } catch {
            return null
        }
    },

    /*
     * Check if user has admin profile
     */
    isAdmin: (token) => {
        const payload = lib_auth.getPayloadAccessToken(token)
        if (!payload)
            return false
        return (('prf' in payload) && (payload.prf === lib_auth.TOKEN_PROFILE_ADMIN))
    },

    /*
     * Local logout
     */
    logout: () => {
        // Clears session storage
        lib_auth.setRefreshToken(null)
        lib_auth.setAccessToken(null)
        sessionStorage.setItem('activeTab', '')
        sessionStorage.setItem('indexerType', '')
        lib_cmn.goToHomePage()
    }

}
