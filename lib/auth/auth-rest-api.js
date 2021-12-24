/*!
 * lib/auth/auth-rest-api.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */


// eslint-disable-next-line import/no-unresolved
import { urlencoded } from 'milliparsec'
import passport from 'passport'
import network from '../bitcoin/network.js'
import keysFile from '../../keys/index.js'
import HttpServer from '../http-server/http-server.js'
import authentMgr from './authentication-manager.js'
import authorzMgr from './authorizations-manager.js'

const keys = keysFile[network.key]

/**
 * Auth API endpoints
 */
class AuthRestApi {

    /**
     * Constructor
     * @param {HttpServer} httpServer - HTTP server
     */
    constructor(httpServer) {
        this.httpServer = httpServer

        // Initialize passport
        this.httpServer.app.use(passport.initialize())

        // Check if authentication is activated
        if (keys.auth.activeStrategy == null)
            return

        // Establish routes
        const urlencodedParser = urlencoded()

        this.httpServer.app.post(
            '/auth/login',
            urlencodedParser,
            authentMgr.authenticate({ session: false }),
            authentMgr.serialize,
            authorzMgr.generateAuthorizations.bind(authorzMgr),
            this.login.bind(this)
        )

        this.httpServer.app.post(
            '/auth/logout',
            urlencodedParser,
            authorzMgr.revokeAuthorizations.bind(authorzMgr),
            this.logout.bind(this)
        )

        this.httpServer.app.post(
            '/auth/refresh',
            urlencodedParser,
            authorzMgr.refreshAuthorizations.bind(authorzMgr),
            this.refresh.bind(this)
        )
    }

    /**
     * Login
     * @param {object} req - http request object
     * @param {object} res - http response object
     */
    login(req, res) {
        try {
            const result = { authorizations: req.authorizations }
            const returnValue = JSON.stringify(result, null, 2)
            HttpServer.sendRawData(res, returnValue)
        } catch (error) {
            HttpServer.sendError(res, error)
        }
    }

    /**
     * Refresh
     * @param {object} req - http request object
     * @param {object} res - http response object
     */
    refresh(req, res) {
        try {
            const result = { authorizations: req.authorizations }
            const returnValue = JSON.stringify(result, null, 2)
            HttpServer.sendRawData(res, returnValue)
        } catch (error) {
            HttpServer.sendError(res, error)
        }
    }

    /**
     * Logout
     * @param {object} req - http request object
     * @param {object} res - http response object
     */
    logout(req, res) {
        HttpServer.sendOk(res)
    }

}

export default AuthRestApi
