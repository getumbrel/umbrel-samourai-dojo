/*!
 * tracker/tracker.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const zmq = require('zeromq/v5-compat')
const network = require('../lib/bitcoin/network')
const keys = require('../keys')[network.key]
const BlockchainProcessor = require('./blockchain-processor')
const MempoolProcessor = require('./mempool-processor')
const util = require('../lib/util')


/**
 * A class implementing a process tracking the blockchain
 */
class Tracker {

  /**
   * Constructor
   */
  constructor() {
    // Notification socket for client events
    this.notifSock = zmq.socket('pub')
    this.notifSock.bind(`tcp://127.0.0.1:${keys.ports.tracker}`, () => {
      // Initialize the blockchain processor
      // and the mempool buffer
      this.initialized = true
      this.blockchainProcessor = new BlockchainProcessor(this.notifSock)
      this.mempoolProcessor = new MempoolProcessor(this.notifSock)
    })
  }

  /**
   * Start the tracker
   * @returns {Promise<void>}
   */
  async start() {
    if (!this.initialized) {
      await util.delay(1000)

      return this.start()
    }

    await this.blockchainProcessor.start()
    await this.mempoolProcessor.start()
  }

  /**
   * Stop the tracker
   */
  async stop() {
    clearTimeout(this.startupTimeout)
    await this.blockchainProcessor.stop()
    await this.mempoolProcessor.stop()
  }

}

module.exports = Tracker
