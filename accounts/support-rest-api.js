/*!
 * accounts/support-rest-api.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const fs = require('fs')
const validator = require('validator')
const bodyParser = require('body-parser')
const errors = require('../lib/errors')
const Logger = require('../lib/logger')
const authMgr = require('../lib/auth/authorizations-manager')
const HttpServer = require('../lib/http-server/http-server')
const network = require('../lib/bitcoin/network')
const hdaService = require('../lib/bitcoin/hd-accounts-service')
const addrService = require('../lib/bitcoin/addresses-service')
const HdAccountInfo = require('../lib/wallet/hd-account-info')
const AddressInfo = require('../lib/wallet/address-info')
const apiHelper = require('./api-helper')
const keys = require('../keys')[network.key]

const debugApi = !!(process.argv.indexOf('api-debug') > -1)


/**
 * Support API endpoints
 */
class SupportRestApi {

  /**
   * Constructor
   * @param {pushtx.HttpServer} httpServer - HTTP server
   */
  constructor(httpServer) {
    this.httpServer = httpServer

    // Establish routes
    const urlencodedParser = bodyParser.urlencoded({ extended: true })

    this.httpServer.app.get(
      `/${keys.prefixes.support}/address/:addr/info`,
      authMgr.checkHasAdminProfile.bind(authMgr),
      this.validateAddress.bind(this),
      this.getAddressInfo.bind(this),
    )

    this.httpServer.app.get(
      `/${keys.prefixes.support}/address/:addr/rescan`,
      authMgr.checkHasAdminProfile.bind(authMgr),
      this.validateAddress.bind(this),
      this.getAddressRescan.bind(this),
    )

    this.httpServer.app.get(
      `/${keys.prefixes.support}/xpub/:xpub/info`,
      authMgr.checkHasAdminProfile.bind(authMgr),
      this.validateArgsGetXpubInfo.bind(this),
      this.getXpubInfo.bind(this),
    )

    this.httpServer.app.get(
      `/${keys.prefixes.support}/xpub/:xpub/rescan`,
      authMgr.checkHasAdminProfile.bind(authMgr),
      this.validateArgsGetXpubRescan.bind(this),
      this.getXpubRescan.bind(this),
    )

    this.httpServer.app.get(
      `/${keys.prefixes.support}/xpub/:xpub/delete`,
      authMgr.checkHasAdminProfile.bind(authMgr),
      this.validateArgsGetXpubDelete.bind(this),
      this.getXpubDelete.bind(this),
    )

    this.httpServer.app.get(
      `/${keys.prefixes.support}/pairing/explorer`,
      authMgr.checkHasAdminProfile.bind(authMgr),
      this.getPairingExplorer.bind(this),
    )

    this.httpServer.app.get(
      `/${keys.prefixes.support}/pairing`,
      authMgr.checkHasAdminProfile.bind(authMgr),
      this.getPairing.bind(this),
    )
  }

  /**
   * Retrieve information for a given address
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  async getAddressInfo(req, res) {
    try {
      // Parse the entities passed as url params
      const entities = apiHelper.parseEntities(req.params.addr).addrs
      if (entities.length == 0)
        return HttpServer.sendError(res, errors.address.INVALID)

      const address = entities[0]
      const info = new AddressInfo(address)
      await info.loadInfoExtended()
      await info.loadTransactions()
      await info.loadUtxos()
      const ret = this._formatAddressInfoResult(info)
      HttpServer.sendRawData(res, ret)

    } catch(e) {
      HttpServer.sendError(res, errors.generic.GEN)

    } finally {
      debugApi && Logger.info(`API : Completed GET /support/address/${req.params.addr}/info`)
    }
  }

  /**
   * Format response to be returned
   * for calls to getAddressInfo
   * @param {AddressInfo} info
   * @returns {string} return the json to be sent as a response
   */
  _formatAddressInfoResult(info) {
    const res = info.toPojoExtended()
    return JSON.stringify(res, null, 2)
  }

  /**
   * Rescan the blockchain for a given address
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  async getAddressRescan(req, res) {
    try {
      // Parse the entities passed as url params
      const entities = apiHelper.parseEntities(req.params.addr).addrs
      if (entities.length == 0)
        return HttpServer.sendError(res, errors.address.INVALID)

      const address = entities[0]

      const ret = {
        status: 'Rescan complete',
      }

      await addrService.rescan(address)
      HttpServer.sendRawData(res, JSON.stringify(ret, null, 2))

    } catch(e) {
      HttpServer.sendError(res, errors.generic.GEN)

    } finally {
      debugApi && Logger.info(`API : Completed GET /support/address/${req.params.addr}/rescan`)
    }
  }

  /**
   * Retrieve information for a given hd account
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  async getXpubInfo(req, res) {
    try {
      // Parse the entities passed as url params
      const entities = apiHelper.parseEntities(req.params.xpub).xpubs
      if (entities.length == 0)
        return HttpServer.sendError(res, errors.xpub.INVALID)

      const xpub = entities[0]
      let info

      try {
        info = new HdAccountInfo(xpub)
        await info.loadInfo()
        const ret = this._formatXpubInfoResult(info)
        HttpServer.sendRawData(res, ret)
      } catch(e) {
        if(e == errors.db.ERROR_NO_HD_ACCOUNT) {
          const ret = this._formatXpubInfoResult(info)
          HttpServer.sendRawData(res, ret)
        } else {
          HttpServer.sendError(res, errors.generic.GEN)
        }
      }

    } catch(e) {
      HttpServer.sendError(res, errors.generic.GEN)

    } finally {
      debugApi && Logger.info(`API : Completed GET /support/xpub/${req.params.xpub}/info`)
    }
  }

  /**
   * Format response to be returned
   * for calls to getXpubInfo
   * @param {HdAccountInfo} info
   * @returns {string} return the json to be sent as a response
   */
  _formatXpubInfoResult(info) {
    const res = info.toPojoExtended()
    return JSON.stringify(res, null, 2)
  }

  /**
   * Rescan the blockchain for a given address
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  async getXpubRescan(req, res) {
    try {
      // Parse the entities passed as url params
      const entities = apiHelper.parseEntities(req.params.xpub).xpubs
      if (entities.length == 0)
        return HttpServer.sendError(res, errors.xpub.INVALID)

      const xpub = entities[0]

      const ret = {
        status: 'Rescan complete',
      }

      const gapLimit = req.query.gap != null ? parseInt(req.query.gap) : 0
      const startIndex = req.query.startidx != null ? parseInt(req.query.startidx) : 0

      try {
        await hdaService.rescan(xpub, gapLimit, startIndex)
        HttpServer.sendRawData(res, JSON.stringify(ret, null, 2))
      } catch(e) {
        if (e == errors.db.ERROR_NO_HD_ACCOUNT) {
          ret.status = 'Error: Not tracking xpub'
          HttpServer.sendRawData(res, JSON.stringify(ret, null, 2))
        } else if (e == errors.xpub.OVERLAP) {
          ret.status = 'Error: Rescan in progress'
          HttpServer.sendRawData(res, JSON.stringify(ret, null, 2))
        } else {
          ret.status = 'Rescan Error'
          Logger.error(e, 'API : SupportRestApi.getXpubRescan() : Support rescan error')
          HttpServer.sendError(res, JSON.stringify(ret, null, 2))
        }
      }

    } catch(e) {
      HttpServer.sendError(res, errors.generic.GEN)

    } finally {
      debugApi && Logger.info(`API : Completed GET /support/xpub/${req.params.xpub}/rescan`)
    }
  }

  /**
   * Delete all data related to a hd account
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  async getXpubDelete(req, res) {
    try {
      // Parse the entities passed as url params
      const entities = apiHelper.parseEntities(req.params.xpub).xpubs
      if (entities.length == 0)
        return HttpServer.sendError(res, errors.xpub.INVALID)

      const xpub = entities[0]

      try {
        await hdaService.deleteHdAccount(xpub)
        HttpServer.sendOk(res)
      } catch(e) {
        HttpServer.sendError(res, e)
      }

    } catch(e) {
      HttpServer.sendError(res, errors.generic.GEN)

    } finally {
      debugApi && Logger.info(`API : Completed GET /support/xpub/${req.params.xpub}/delete`)
    }
  }


  /**
   * Get pairing info
   */
  async getPairing(req, res) {
    try {
      const ret = {
        'pairing': {
          'type': 'dojo.api',
          'version': keys.dojoVersion,
          'apikey': keys.auth.strategies.localApiKey.apiKeys[0]
        }
      }
      HttpServer.sendRawData(res, JSON.stringify(ret, null, 2))
    } catch(e) {
      const ret = {
        status: 'error'
      }
      Logger.error(e, 'API : SupportRestApi.getPairing() : Support pairing error')
      HttpServer.sendError(res, JSON.stringify(ret, null, 2))
    } finally {
      debugApi && Logger.info(`API : Completed GET /pairing`)
    }
  }

  /**
   * Get pairing info for the local block explorer
   */
  async getPairingExplorer(req, res) {
    try {
      const ret = {
        'pairing': {
          'type': `explorer.${keys.explorer.active}`,
          'url': keys.explorer.uri,
          'key': keys.explorer.password
        }
      }
      HttpServer.sendRawData(res, JSON.stringify(ret, null, 2))
    } catch(e) {
      const ret = {
        status: 'error'
      }
      Logger.error(e, 'API : SupportRestApi.getPairingExplorer() : Support pairing error')
      HttpServer.sendError(res, JSON.stringify(ret, null, 2))
    } finally {
      debugApi && Logger.info(`API : Completed GET /pairing/explorer`)
    }
  }

  /**
   * Validate arguments related to GET xpub info requests
   * @param {object} req - http request object
   * @param {object} res - http response object
   * @param {function} next - next tiny-http middleware
   */
  validateArgsGetXpubInfo(req, res, next) {
    const isValidXpub = validator.isAlphanumeric(req.params.xpub)

    if (!isValidXpub) {
      HttpServer.sendError(res, errors.body.INVDATA)
      Logger.error(null, `API : SupportRestApi.validateArgsGetXpubInfo() : Invalid xpub ${req.params.xpub}`)
    } else {
      next()
    }
  }

  /**
   * Validate arguments related to GET xpub rescan requests
   * @param {object} req - http request object
   * @param {object} res - http response object
   * @param {function} next - next tiny-http middleware
   */
  validateArgsGetXpubRescan(req, res, next) {
    const isValidXpub = validator.isAlphanumeric(req.params.xpub)
    const isValidGap = !req.query.gap || validator.isInt(req.query.gap)

    if (!(isValidXpub && isValidGap)) {
      HttpServer.sendError(res, errors.body.INVDATA)
      Logger.error(null, 'API : SupportRestApi.validateArgsGetXpubRescan() : Invalid arguments')
    } else {
      next()
    }
  }

  /**
   * Validate arguments related to GET xpub delete requests
   * @param {object} req - http request object
   * @param {object} res - http response object
   * @param {function} next - next tiny-http middleware
   */
  validateArgsGetXpubDelete(req, res, next) {
    const isValidXpub = validator.isAlphanumeric(req.params.xpub)

    if (!isValidXpub) {
      HttpServer.sendError(res, errors.body.INVDATA)
      Logger.error(null, `API : SupportRestApi.validateArgsGetXpubDelete() : Invalid xpub ${req.params.xpub}`)
    } else {
      next()
    }
  }

  /**
   * Validate arguments related to addresses requests
   * @param {object} req - http request object
   * @param {object} res - http response object
   * @param {function} next - next tiny-http middleware
   */
  validateAddress(req, res, next) {
    const isValidAddress = validator.isAlphanumeric(req.params.addr)

    if (!isValidAddress) {
      HttpServer.sendError(res, errors.body.INVDATA)
      Logger.error(null, `API : SupportRestApi.validateAddress() : Invalid address ${req.params.addr}`)
    } else {
      next()
    }
  }
}

module.exports = SupportRestApi
