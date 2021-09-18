/*!
 * pushtx/pushtx-processor.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const bitcoin = require('bitcoinjs-lib')
const zmq = require('zeromq/v5-compat')
const Logger = require('../lib/logger')
const errors = require('../lib/errors')
const db = require('../lib/db/mysql-db-wrapper')
const { createRpcClient } = require('../lib/bitcoind-rpc/rpc-client')
const addrHelper = require('../lib/bitcoin/addresses-helper')
const network = require('../lib/bitcoin/network')
const activeNet = network.network
const keys = require('../keys')[network.key]
const status = require('./status')

let Sources
if (network.key === 'bitcoin') {
  Sources = require('../lib/remote-importer/sources-mainnet')
} else {
  Sources = require('../lib/remote-importer/sources-testnet')
}


/**
 * A singleton providing a wrapper
 * for pushing transactions with the local bitcoind
 */
class PushTxProcessor {

  /**
   * Constructor
   */
  constructor() {
    this.notifSock = null
    this.sources = new Sources()
    // Initialize the rpc client
    this.rpcClient = createRpcClient()
  }

  /**
   * Initialize the sockets for notifications
   */
  initNotifications(config) {
    // Notification socket for the tracker
    this.notifSock = zmq.socket('pub')
    this.notifSock.bind(config.uriSocket)
  }

  /**
   * Enforce a strict verification mode on a list of outputs
   * @param {string} rawtx - raw bitcoin transaction in hex format
   * @param {array} vouts - output indices (integer)
   * @returns {array} returns the indices of the faulty outputs
   */
  async enforceStrictModeVouts(rawtx, vouts) {
    const faultyOutputs = []
    const addrMap = {}
    let tx
    try {
      tx = bitcoin.Transaction.fromHex(rawtx)
    } catch(e) {
      throw errors.tx.PARSE
    }
    // Check in db if addresses are known and have been used
    for (let vout of vouts) {
      if (vout >= tx.outs.length)
        throw errors.txout.VOUT
      const output = tx.outs[vout]
      const address = addrHelper.outputScript2Address(output.script)
      const nbTxs = await db.getAddressNbTransactions(address)
      if (nbTxs == null || nbTxs > 0)
        faultyOutputs.push(vout)
      else
        addrMap[address] = vout
    }
    // Checks with indexer if addresses are known and have been used
    if (Object.keys(addrMap).length > 0) {
      if (keys.indexer.active !== 'local_bitcoind') {
        const results = await this.sources.getAddresses(Object.keys(addrMap))
        for (let r of results)
          if (r.ntx > 0)
            faultyOutputs.push(addrMap[r.address])
      }
    }
    return faultyOutputs
  }

  /**
   * Push transactions to the Bitcoin network
   * @param {string} rawtx - raw bitcoin transaction in hex format
   * @returns {string} returns the txid of the transaction
   */
  async pushTx(rawtx) {
    let value = 0

    // Attempt to parse incoming TX hex as a bitcoin Transaction
    try {
      const tx = bitcoin.Transaction.fromHex(rawtx)
      for (let output of tx.outs)
        value += output.value
      Logger.info('PushTx : Push for ' + (value / 1e8).toFixed(8) + ' BTC')
    } catch(e) {
      throw errors.tx.PARSE
    }

    // At this point, the raw hex parses as a legitimate transaction.
    // Attempt to send via RPC to the bitcoind instance
    try {
      const txid = await this.rpcClient.sendrawtransaction({ hexstring: rawtx })
      Logger.info('PushTx : Pushed!')
      // Update the stats
      status.updateStats(value)
      // Notify the tracker
      this.notifSock.send(['pushtx', rawtx])
      return txid
    } catch(err) {
      Logger.info('PushTx : Push failed')
      throw err
    }
  }

}

module.exports = new PushTxProcessor()
