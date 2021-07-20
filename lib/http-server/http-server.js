/*!
 * lib/http-server/http-server.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const { App } = require('@tinyhttp/app')
const sirv = require('sirv')
const helmet = require('helmet')
const Logger = require('../logger')
const errors = require('../errors');


/**
 * HTTP server
 */
class HttpServer {

  /**
   * Constructor
   * @param {int} port - port used by the http server
   * @param {string} host - host exposing the http server
   */
  constructor(port, host) {
    // Initialize server host and port
    this.host = host ? host : '127.0.0.1'
    this.port = port

    // Listening server instance
    this.server = null

    // Initialize the tiny-http app
    this.app = new App({
      // Error handler
      onError: (err, req, res) => {
        // Detect if this is auth error
        if (Object.values(errors.auth).includes(err)) {
          HttpServer.sendError(res, err, 401)
        } else {
          Logger.error(err.stack, 'HttpServer : general error')
          const ret = {status: 'Server error'}
          HttpServer.sendError(res, ret, 500)
        }
      }
    });

    // Middlewares for json responses and requests logging
    this.app.use(HttpServer.requestLogger)
    this.app.use(HttpServer.setCrossOrigin)
    this.app.use(helmet(HttpServer.HELMET_POLICY))

    this.app.use('/static', sirv('../static'));

    this.app.use(HttpServer.setJSONResponse)
    this.app.use(HttpServer.setConnection)
  }


  /**
   * Start the http server
   * @returns {object} returns the listening server instance
   */
  start() {
    // Start a http server
    this.server = this.app.listen(this.port, this.host, () => {
      Logger.info(`HttpServer : Listening on ${this.host}:${this.port}`)
    })

    this.server.timeout = 600 * 1000
    // @see https://github.com/nodejs/node/issues/13391
    this.server.keepAliveTimeout = 0

    return this.server
  }

  /**
   * Stop the http server
   */
  stop() {
    if (this.app === null) return
    this.app.close()
  }

  /**
   * Return a http response without data
   * @param {object} res - http response object
   */
  static sendOk(res) {
    const ret = {status: 'ok'}
    res.status(200).json(ret)
  }

  /**
   * Return a http response without status
   * @param {object} res - http response object
   */
  static sendOkDataOnly(res, data) {
    res.status(200).json(data)
  }

  /**
   * Return a http response with status and data
   * @param {object} res - http response object
   * @param {object} data - data object
   */
  static sendOkData(res, data) {
    const ret = {
      status: 'ok',
      data: data
    }
    res.status(200).json(ret)
  }

  /**
   * Return a http response with raw data
   * @param {object} res - http response object
   * @param {object} data - data object
   */
  static sendRawData(res, data) {
    res.status(200).send(data)
  }

  /**
   * Return an error response
   * @param {object} res - http response object
   * @param {string | Error} data - data object
   * @param {number} [errorCode=400] - HTTP status code
   */
  static sendError(res, data, errorCode) {
    if (errorCode == null)
      errorCode = 400

    if (data instanceof Error) {
      Logger.error(data, 'API: Unhandled error')
      data = errors.generic.GEN
    }

    const ret = {
      status: 'error',
      error: data
    }

    res.status(errorCode).json(ret)
  }

  /*
   * A middleware returning an authorization error response
   * @param {object} res - http response object
   * @param {string} err - error
   */
  static sendAuthError(res, err) {
    if (err) {
      HttpServer.sendError(res, err, 401)
    }
  }

  /**
   * Express middleware returnsing a json response
   * @param {object} req - http request object
   * @param {object} res - http response object
   * @param {function} next - next middleware
   */
  static setJSONResponse(req, res, next) {
    res.set('Content-Type', 'application/json')
    next()
  }

  /**
   * Express middleware adding cors header
   * @param {object} req - http request object
   * @param {object} res - http response object
   * @param {function} next - next middleware
   */
  static setCrossOrigin(req, res, next) {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET,HEAD,POST,DELETE')
    res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
    next()
  }

  /**
   * Express middleware adding connection header
   * @param {object} req - http request object
   * @param {object} res - http response object
   * @param {function} next - next middleware
   */
  static setConnection(req, res, next) {
    res.set('Connection', 'close')
    next()
  }

  /**
   * Express middleware logging url and methods called
   * @param {object} req - http request object
   * @param {object} res - http response object
   * @param {function} next - next middleware
   */
  static requestLogger(req, res, next) {
    Logger.info(`HttpServer : ${req.method} ${req.url}`)
    next()
  }

}

/**
 * Helmet Policy
 */
HttpServer.HELMET_POLICY = {
  'contentSecurityPolicy' : {
    'directives': {
      'default-src': ["'self'", "data:"],
      'base-uri': ["'self'"],
      'font-src': ["'self'", "https:", "data:"],
      'frame-ancestors': ["'self'"],
      'img-src': ["'self'", "data:"],
      'object-src': ["'none'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "https:", "'unsafe-inline'"],
      'media-src': ["'self'", 'data:'],
    },
    'browserSniff': false,
    'disableAndroid': true
  },
  'dnsPrefetchControl': true,
  'frameguard': true,
  'hidePoweredBy': true,
  'hpkp': false,
  'hsts': true,
  'ieNoOpen': true,
  'noCache': true,
  'noSniff': true,
  'referrerPolicy': true,
  'xssFilter': true
}


module.exports = HttpServer
