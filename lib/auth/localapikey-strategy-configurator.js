/*!
 * lib/auth/localapikey-strategy-configurator.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */


import passport from 'passport'
import passportLocalApiKey from 'passport-localapikey-update'
import network from '../bitcoin/network.js'
import keysFile from '../../keys/index.js'
import errors from '../errors.js'
import Logger from '../logger.js'
import authorzMgr from './authorizations-manager.js'

const Strategy = passportLocalApiKey.Strategy
const keys = keysFile[network.key]

/**
 * A Passport configurator for a local API key strategy
 */
class LocalApiKeyStrategyConfigurator {

  /**
   * Constructor
   */
  constructor() {}

  /**
   * Configure the strategy
   */
  configure() {
    const strategy = new Strategy({apiKeyField: 'apikey'}, this.authenticate)
    passport.use(LocalApiKeyStrategyConfigurator.NAME, strategy)
  }

  /**
   * Authentication
   * @param {string} apiKey - api key received
   * @param {function} done - callback
   */
  authenticate(apiKey, done) {
    const _adminKey = keys.auth.strategies[LocalApiKeyStrategyConfigurator.NAME].adminKey
    const _apiKeys = keys.auth.strategies[LocalApiKeyStrategyConfigurator.NAME].apiKeys

    if (apiKey === _adminKey) {
      // Check if received key is a valid api key
      Logger.info('Auth : Successful authentication with an admin key')
      return done(null, {'profile': authorzMgr.TOKEN_PROFILE_ADMIN})
    } else if (_apiKeys.indexOf(apiKey) >= 0) {
      // Check if received key is a valid api key
      Logger.info('Auth : Successful authentication with an api key')
      return done(null, {'profile': authorzMgr.TOKEN_PROFILE_API})
    } else {
      Logger.error(null, `Auth : Authentication failure (apikey=${apiKey})`)
      return done(errors.auth.INVALID_API_KEY, false)
    }
  }

}

LocalApiKeyStrategyConfigurator.NAME = 'localApiKey'

export default LocalApiKeyStrategyConfigurator
