/*!
 * lib/auth/authentication-manager.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */


import passport from 'passport'

import network from '../bitcoin/network.js'
import keysFile from '../../keys/index.js'
import errors from '../errors.js'
import Logger from '../logger.js'

const keys = keysFile[network.key]


/**
 * A singleton managing the authentication to the API
 */
class AuthenticationManager {

    constructor() {
        this.activeStrategyName = ''
        this.activeStrategy = null
        // Configure the authentication strategy
        this._configureStrategy()
    }

    /**
     * Configure the active strategy
     */
    async _configureStrategy() {
        if (keys.auth.activeStrategy) {
            this.activeStrategyName = keys.auth.activeStrategy

            try {
                const configuratorName = keys.auth.strategies[this.activeStrategyName].configurator
                const ConfiguratorFile = await import(`./${configuratorName}.js`)
                const Configurator = ConfiguratorFile.default

                if (Configurator) {
                    this.activeStrategy = new Configurator()
                    this.activeStrategy.configure()
                    Logger.info(`Auth : Authentication strategy ${this.activeStrategyName} successfully configured`)
                }

            } catch (error) {
                Logger.error(error, errors.auth.INVALID_CONF)
            }
        }
    }

    /**
     * Authenticate a user
     * @param {Object} options
     */
    authenticate(options) {
        return passport.authenticate(this.activeStrategyName, options)
    }

    /**
     * Serialize user's information
     * @param {Object} req - http request object
     * @param {Object} res - http response object
     * @param {function} next - callback
     */
    serialize(req, res, next) {
        if (req.user == null)
            req.user = {}

        req.user.authenticated = true
        next()
    }

}


export default new AuthenticationManager()
