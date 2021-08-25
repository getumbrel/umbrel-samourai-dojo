/*!
 * accounts/multiaddr-rest-api.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */


import bodyParser from 'body-parser'

import Logger from '../lib/logger.js'
import errors from '../lib/errors.js'
import walletService from '../lib/wallet/wallet-service.js'
import authMgr from '../lib/auth/authorizations-manager.js'
import HttpServer from '../lib/http-server/http-server.js'
import apiHelper from './api-helper.js'

const debugApi = process.argv.indexOf('api-debug') > -1


/**
 * Multiaddr API endpoints
 * @deprecated
 */
class MultiaddrRestApi {

  /**
   * Constructor
   * @param {pushtx.HttpServer} httpServer - HTTP server
   */
  constructor(httpServer) {
    this.httpServer = httpServer

    // Establish routes
    const urlencodedParser = bodyParser.urlencoded({ extended: true })

    this.httpServer.app.get(
        '/multiaddr',
        authMgr.checkAuthentication.bind(authMgr),
        apiHelper.validateEntitiesParams.bind(apiHelper),
        this.getMultiaddr.bind(this),
        HttpServer.sendAuthError
    )

    this.httpServer.app.post(
        '/multiaddr',
        urlencodedParser,
        authMgr.checkAuthentication.bind(authMgr),
        apiHelper.validateEntitiesParams.bind(apiHelper),
        this.postMultiaddr.bind(this),
        HttpServer.sendAuthError
    )
  }

  /**
   * Handle multiaddr GET request
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  async getMultiaddr(req, res) {
    try {
      // Check request params
      if (!apiHelper.checkEntitiesParams(req.query))
        return HttpServer.sendError(res, errors.multiaddr.NOACT)
      //return HttpServer.sendError(res, '')
      // Parse params
      const entities = apiHelper.parseEntitiesParams(req.query)

      if (entities.active.addrs.length === 1 || entities.active.addrs.length === 2 || entities.active.xpubs.length === 1)
        return HttpServer.sendError(res, '')

      const result = await walletService.getWalletInfo(
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

        Logger.info(`API : Completed GET /multiaddr ${strParams}`)
      }
    }
  }

  /**
   * Handle multiaddr POST request
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  async postMultiaddr(req, res) {
    try {
      // Check request params
      if (!apiHelper.checkEntitiesParams(req.body))
        return HttpServer.sendError(res, errors.multiaddr.NOACT)

      // Parse params
      const entities = apiHelper.parseEntitiesParams(req.body)

      const result = await walletService.getWalletInfo(
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

        Logger.info(`API : Completed POST /multiaddr ${strParams}`)
      }
    }
  }

}

export default MultiaddrRestApi
