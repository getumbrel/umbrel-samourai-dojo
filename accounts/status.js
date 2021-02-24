/*!
 * accounts/status.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const network = require('../lib/bitcoin/network')
const keys = require('../keys')[network.key]
const util = require('../lib/util')
const Logger = require('../lib/logger')
const db = require('../lib/db/mysql-db-wrapper')
const remote = require('../lib/remote-importer/remote-importer')


/**
 * Singleton providing information about the accounts endpoints
 */
class Status {

  /**
   * Constructor
   */
  constructor() {
    this.t0 = Date.now()
    this.clients = 0
    this.sessions = 0
    this.maxConn = 0
  }

  /**
   * Get current status
   * @returns {Promise - object} status object
   */
  async getCurrent() {
    const uptime = util.timePeriod((Date.now() - this.t0) / 1000, false)
    const memory = `${util.toMb(process.memoryUsage().rss)} MiB`

    // Get highest block processed by the tracker
    let dbMaxHeight = null
    try {
      const highest = await db.getHighestBlock()
      dbMaxHeight = highest.blockHeight
    } catch(e) {
      Logger.error(e, 'API : Status.getCurrent() :')
    }

    // Get info about the indexer
    const indexerType = keys.indexer.active
    let indexerMaxHeight = null
    let indexerUrl = null

    if (indexerType == 'third_party_explorer') {
      indexerUrl = (network.key == 'bitcoin')
        ? keys.indexer.oxt
        : keys.indexer.esplora
    }

    try {
       const chaintip = await remote.getChainTipHeight()
       indexerMaxHeight = chaintip['chainTipHeight']
    } catch(e) {
      Logger.error(e, 'API : Status.getCurrent() :')
    }

    return {
      uptime: uptime,
      memory: memory,
      ws: {
        clients: this.clients,
        sessions: this.sessions,
        max: this.maxConn
      },
      blocks: dbMaxHeight,
      indexer: {
        type: indexerType,
        url: indexerUrl,
        maxHeight: indexerMaxHeight
      }
    }
  }

}

module.exports = new Status()
