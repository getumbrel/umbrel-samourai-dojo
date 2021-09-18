/*!
 * accounts/wallet-rest-api.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const bodyParser = require('body-parser')
const Logger = require('../lib/logger')
const errors = require('../lib/errors')
const walletService = require('../lib/wallet/wallet-service')
const authMgr = require('../lib/auth/authorizations-manager')
const HttpServer = require('../lib/http-server/http-server')
const apiHelper = require('./api-helper')
const hdaService = require('../lib/bitcoin/hd-accounts-service')

const debugApi = process.argv.indexOf('api-debug') > -1

/**
 * Wallet API endpoints
 */
class WalletRestApi {

  /**
   * Constructor
   * @param {pushtx.HttpServer} httpServer - HTTP server
   */
  constructor(httpServer) {
    this.httpServer = httpServer

    // Establish routes
    const urlencodedParser = bodyParser.urlencoded({ extended: true })

    this.httpServer.app.get(
      '/wallet',
      authMgr.checkAuthentication.bind(authMgr),
      apiHelper.validateEntitiesParams.bind(apiHelper),
      this.getWallet.bind(this),
    )

    this.httpServer.app.post(
      '/wallet',
      urlencodedParser,
      authMgr.checkAuthentication.bind(authMgr),
      apiHelper.validateEntitiesParams.bind(apiHelper),
      this.postWallet.bind(this),
    )
  }

  /**
   * Handle wallet GET request
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  async getWallet(req, res) {
    try {
      // Check request params
      if (!apiHelper.checkEntitiesParams(req.query))
        return HttpServer.sendError(res, errors.multiaddr.NOACT)

      // Parse params
      const entities = apiHelper.parseEntitiesParams(req.query)

      if (req.query.importPostmixLikeTypeChange) {
        await hdaService.importPostmixLikeTypeChange(entities.active.xpubs)
      }

      const result = await walletService.getFullWalletInfo(
        entities.active,
        entities.legacy,
        entities.bip49,
        entities.bip84,
        entities.pubkey
      )

      const ret = JSON.stringify(result, null, 2)
      HttpServer.sendRawData(res, ret)

    } catch(e) {
      HttpServer.sendError(res, e)

    } finally {
      if (debugApi) {
        const strParams =
          `${req.query.active ? req.query.active : ''} \
          ${req.query.new ? req.query.new : ''} \
          ${req.query.pubkey ? req.query.pubkey : ''} \
          ${req.query.bip49 ? req.query.bip49 : ''} \
          ${req.query.bip84 ? req.query.bip84 : ''}`

        Logger.info(`API : Completed GET /wallet ${strParams}`)
      }
    }
  }

  /**
   * Handle wallet POST request
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  async postWallet(req, res) {
    try {
      // Check request params
      if (!apiHelper.checkEntitiesParams(req.body))
        return HttpServer.sendError(res, errors.multiaddr.NOACT)

      // Parse params
      const entities = apiHelper.parseEntitiesParams(req.body)

      if (req.body.importPostmixLikeTypeChange) {
        await hdaService.importPostmixLikeTypeChange(entities.active.xpubs)
      }

      const result = await walletService.getFullWalletInfo(
        entities.active,
        entities.legacy,
        entities.bip49,
        entities.bip84,
        entities.pubkey
      )

      HttpServer.sendOkDataOnly(res, result)

    } catch(e) {
      HttpServer.sendError(res, e)

    } finally {
      if (debugApi) {
        const strParams =
          `${req.body.active ? req.body.active : ''} \
          ${req.body.new ? req.body.new : ''} \
          ${req.body.pubkey ? req.body.pubkey : ''} \
          ${req.body.bip49 ? req.body.bip49 : ''} \
          ${req.body.bip84 ? req.body.bip84 : ''}`

        Logger.info(`API : Completed POST /wallet ${strParams}`)
      }
    }
  }

}

module.exports = WalletRestApi
