/*!
 * pushtx/pushtx-rest-api.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const qs = require('querystring')
const validator = require('validator')
const bodyParser = require('body-parser')
const Logger = require('../lib/logger')
const errors = require('../lib/errors')
const authMgr = require('../lib/auth/authorizations-manager')
const HttpServer = require('../lib/http-server/http-server')
const network = require('../lib/bitcoin/network')
const keys = require('../keys')[network.key]
const status = require('./status')
const pushTxProcessor = require('./pushtx-processor')
const TransactionsScheduler = require('./transactions-scheduler')


/**
 * PushTx API endpoints
 */
class PushTxRestApi {

  /**
   * Constructor
   * @param {pushtx.HttpServer} httpServer - HTTP server
   */
  constructor(httpServer) {
    this.httpServer = httpServer
    this.scheduler = new TransactionsScheduler()

    // Establish routes
    const jsonParser = bodyParser.json()

    // Establish routes. Proxy server strips /pushtx
    this.httpServer.app.post(
      '/schedule',
      jsonParser,
      authMgr.checkAuthentication.bind(authMgr),
      this.postScheduleTxs.bind(this),
    )

    this.httpServer.app.post(
      '/',
      authMgr.checkAuthentication.bind(authMgr),
      this.postPushTx.bind(this),
    )

    this.httpServer.app.get(
      '/',
      authMgr.checkAuthentication.bind(authMgr),
      this.getPushTx.bind(this),
    )

    this.httpServer.app.get(
      `/${keys.prefixes.statusPushtx}/`,
      authMgr.checkHasAdminProfile.bind(authMgr),
      this.getStatus.bind(this),
    )

    this.httpServer.app.get(
      `/${keys.prefixes.statusPushtx}/schedule`,
      authMgr.checkHasAdminProfile.bind(authMgr),
      this.getStatusSchedule.bind(this),
    )

    // Handle unknown paths, returning a help message
    this.httpServer.app.get(
      '/*',
      authMgr.checkAuthentication.bind(authMgr),
      this.getHelp.bind(this),
    )
  }

  /**
   * Handle Help GET request
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  getHelp(req, res) {
    const ret = {endpoints: ['/pushtx', '/pushtx/schedule']}
    HttpServer.sendError(res, ret, 404)
  }

  /**
   * Handle Status GET request
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  async getStatus(req, res) {
    try {
      const currStatus = await status.getCurrent()
      HttpServer.sendOkData(res, currStatus)
    } catch(e) {
      this._traceError(res, e)
    }
  }

  /**
   * Handle status/schedule GET request
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  async getStatusSchedule(req, res) {
    try {
      const ret = await status.getScheduledTransactions()
      HttpServer.sendOkData(res, ret)
    } catch(e) {
      this._traceError(res, e)
    }
  }

  /**
   * Handle pushTx GET request
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  getPushTx(req, res) {
    const ret = errors.get.DISALLOWED
    HttpServer.sendError(res, ret, 405)
  }

  /**
   * Handle POST requests
   * Push transactions to the Bitcoin network
   * @param {object} req - http request object
   * @param {object} res - http response object
   */
  postPushTx(req, res) {
    // Accumulate POST data
    const chunks = []

    req.on('data', chunk => {
      chunks.push(chunk)
    })

    req.on('end', async () => {
      const body = chunks.join('')
      const query = qs.parse(body)

      if (!query.tx)
        return this._traceError(res, errors.body.NOTX)

      if (!validator.isHexadecimal(query.tx))
        return this._traceError(res, errors.body.INVDATA)

      if (query.strict_mode_vouts) {
        try {
          const vouts = query.strict_mode_vouts.split('|').map(v => parseInt(v, 10))
          if (vouts.some(isNaN))
            throw errors.txout.VOUT
          if (vouts.length > 0) {
            let faults = await pushTxProcessor.enforceStrictModeVouts(query.tx, vouts)
            if (faults.length > 0) {
              return this._traceError(res, {
                'message': JSON.stringify({
                  'message': faults,
                  'code': errors.pushtx.VIOLATION_STRICT_MODE_VOUTS
                })
              }, 200)
            }
          }
        } catch(e) {
          return this._traceError(res, e)
        }
      }

      try {
        const txid = await pushTxProcessor.pushTx(query.tx)
        HttpServer.sendOkData(res, txid)
      } catch(e) {
        this._traceError(res, e)
      }
    })
  }

  /**
   * Schedule a list of transactions
   * for delayed pushes
   */
  async postScheduleTxs(req, res) {
    // Check request arguments
    if (!req.body)
      return this._traceError(res, errors.body.NODATA)

    if (!req.body.script)
      return this._traceError(res, errors.body.NOSCRIPT)

    try {
      await this.scheduler.schedule(req.body.script)
      HttpServer.sendOk(res)
    } catch(e) {
      // Returns code 200 if VIOLATION_STRICT_MODE_VOUTS
      if (e.message && e.message.code && e.message.code === errors.pushtx.VIOLATION_STRICT_MODE_VOUTS) {
        e.message = JSON.stringify(e.message)
        this._traceError(res, e, 200)
      } else {
        this._traceError(res, e)
      }
    }
  }

  /**
   * Trace an error during push
   * @param {object} res - http response object
   * @param {object} err - error object
   * @param {number} errorCode - error code (optional)
   */
  _traceError(res, err, errorCode) {
    let ret = null

    errorCode = errorCode == null ? 400 : errorCode

    try {
      if (err.message) {
        let msg = {}
        try {
          msg = JSON.parse(err.message)
        } catch(e) {}

        if (msg.code && msg.message) {
          Logger.error(null, 'PushTx : Error ' + msg.code + ': ' + msg.message)
          ret = msg
        } else {
          Logger.error(err.message, 'PushTx : ')
          ret = err.message
        }
      } else {
        Logger.error(err, 'PushTx : ')
        ret = err
      }
    } catch (e) {
      Logger.error(e, 'PushTx : ')
      ret = e
    } finally {
      HttpServer.sendError(res, ret, errorCode)
    }
  }

}

module.exports = PushTxRestApi
