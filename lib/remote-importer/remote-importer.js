/*!
 * lib/remote-importer/remote-importer.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const _ = require('lodash')
const Logger = require('../logger')
const errors = require('../errors')
const util = require('../util')
const db = require('../db/mysql-db-wrapper')
const rpcTxns = require('../bitcoind-rpc/transactions')
const hdaHelper = require('../bitcoin/hd-accounts-helper')
const network = require('../bitcoin/network')
const keys = require('../../keys')[network.key]
const gap = keys.gap

let Sources

if (network.key === 'bitcoin') {
  Sources = require('./sources-mainnet')
} else {
  Sources = require('./sources-testnet')
}


/**
 * A singleton providing tools
 * for importing HD and loose addresses from remote sources
 */
class RemoteImporter {

  /**
   * Constructor
   */
  constructor() {
    this.STATUS_RESCAN = 'rescan'
    this.STATUS_IMPORT = 'import'
    // Guard against overlapping imports
    this.importing = {}
    this.sources = new Sources()
  }

  /**
   * Clear the guard
   * @param {string} xpub - HDAccount
   */
  clearGuard(xpub) {
    if (this.importing[xpub])
      delete this.importing[xpub]
  }

  /**
   * Check if a xpub is currently being imported or rescanned by Dojo
   * Returns infor about the operation if import/rescan is in progress, otherwise returns null
   * @param {string} xpub - xpub
   * @returns {object}
   */
  importInProgress(xpub) {
    return this.importing[xpub] ? this.importing[xpub] : null
  }

  /**
   * Import an HD account from remote sources
   * @param {string} xpub - HD Account
   * @param {string} type - type of HD Account
   * @param {number} gapLimit - (optional) gap limit for derivation
   * @param {number} startIndex - (optional) rescan shall start from this index
   */
  async importHDAccount(xpub, type, gapLimit, startIndex) {
    if (!hdaHelper.isValid(xpub))
      return Promise.reject(errors.xpub.INVALID)

    if (this.importing[xpub]) {
      Logger.info(`Importer : Import overlap for ${xpub}`)
      return Promise.reject(errors.xpub.OVERLAP)
    }

    this.importing[xpub] = {
      'status': this.STATUS_RESCAN,
      'txs_ext': 0,
      'txs_int': 0
    }

    const ts = hdaHelper.typeString(type)
    Logger.info(`Importer : Importing ${xpub} ${ts}`)

    const t0 = Date.now()
    const chains = [0,1]

    // Allow custom higher gap limits
    // for local scans relying on bitcoind or on a local indexer
    const isLocal = ['local_bitcoind', 'local_indexer'].includes(keys.indexer.active)
    const gaps = (gapLimit && isLocal) ? [gapLimit, gapLimit] : [gap.external, gap.internal]

    startIndex = (startIndex == null) ? -1 : startIndex - 1

    try {
      let results

      // Call in series if bitcoind is used because scantxoutset can only process one import at a time
      if (keys.indexer.active === 'local_bitcoind') {
        results = await util.seriesCall(chains,  chain => {
          return this.xpubScan(xpub, chain, startIndex, startIndex, gaps[chain], type)
        })
      } else {
        results = await util.parallelCall(chains,  chain => {
          return this.xpubScan(xpub, chain, startIndex, startIndex, gaps[chain], type)
        })
      }

      // Accumulate addresses and transactions from all chains
      const txns = results.map(r => r.transactions).flat()
      const addresses = results.map(r => r.addresses).flat()
      const aAddresses = addresses.map(a => a.address)

      this.importing[xpub] = {
        'status': this.STATUS_IMPORT,
        'txs': txns.length
      }

      // Store the hdaccount and the addresses into the database
      await db.ensureHDAccountId(xpub, type)

      const addrChunks = util.splitList(addresses, 1000)
      await util.parallelCall(addrChunks, chunk => {
        return db.addAddressesToHDAccount(xpub, chunk)
      })

      // Store the transaction into the database
      await this._importTransactions(aAddresses, txns)

    } catch(e) {
      Logger.error(e, `Importer : RemoteImporter.importHDAccount() : xpub ${xpub}`)
    } finally {
      Logger.info(`Importer :  xpub import done in ${((Date.now() - t0)/1000).toFixed(1)}s`)
      delete this.importing[xpub]
      return true
    }
  }

  /**
   * Recursive scan of xpub addresses & transactions
   *
   * 0. HD chain       c on [0,1]
   *    Gap limit      G
   *    Last derived   d = -1
   *    Last used      u = -1
   * 1. Derive addresses M/c/{A}, with A on [d+1, u+G], set d = u + G
   * 2. Look up transactions T for M/c/{A} from remote
   * 3. If |T| = 0, go to 5
   * 4. Set u = highest chain index of used address, go to 1
   * 5. Store all in database
   *
   * @returns {object} returns
   *  {
   *    addresses: [{address, chain, index}],
   *    transactions: [{
   *      txid,
   *      version,
   *      locktime,
   *      created,  // if known
   *      block: 'abcdef',  // if confirmed
   *      outputs: [{index, amount, script, address}],
   *      inputs: [{index,outpoint:{txid,index},seq}]
   *    }],
   *  }
   */
  async xpubScan(xpub, c, d, u, G, type, txids) {
    txids = txids || {}

    const ret  = {
      addresses: [],
      transactions: [],
    }

    // Check that next derived isn't after last used + gap limit
    if (d + 1 > u + G) return ret

    // Derive the required number of new addresses
    const A = _.range(d + 1, u + G + 1)
    ret.addresses = await hdaHelper.deriveAddresses(xpub, c, A, type)

    // Update derived index
    d = u + G
    Logger.info(`Importer :  derived M/${c}/${A.join(',')}`)

    const addrMap = ret.addresses.reduce((m,a) => (m[a.address] = a, m), {})
    const aAddresses = ret.addresses.map(a => a.address)

    try {
      const results = await this.sources.getAddresses(aAddresses)
      const filteredResults = results.flat().filter(r => r.ntx > 0)
      const gotTransactions = filteredResults.length > 0
      const scanTx = filteredResults.map(r => r.txids).flat().filter(t => !txids[t])
      u = filteredResults.reduce((m,r) => Math.max(m, addrMap[r.address].index), u)

      Logger.info(`Importer :  Got ${scanTx.length} transactions`)

      // Retrieve the transactions by batches of 200 transactions
      try {
        const txsChunks = util.splitList(scanTx, 200)
        const txs = await util.seriesCall(txsChunks, chunk => {
          return rpcTxns.getTransactions(chunk, false)
        })
        const filteredTxs = txs.flat().filter(tx => tx != null)
        ret.transactions = ret.transactions.concat(filteredTxs)
        txids = filteredTxs.reduce((m,tx) => (m[tx.txid] = true, m), txids)
      } catch(e) {
        Logger.error(e, `Importer : RemoteImporter.xpubScan() : getTransactions error`)
      }

      if (gotTransactions) {
        const keyStatus = (c === 0) ? 'txs_ext' : 'txs_int'
        this.importing[xpub][keyStatus] = Object.keys(txids).length
        // We must go deeper
        const result = await this.xpubScan(xpub, c, d, u, G, type, txids)
        // Accumulate results from further down the rabbit hole
        ret.addresses = ret.addresses.concat(result.addresses)
        ret.transactions = ret.transactions.concat(result.transactions)
      }

    } catch(e) {
      Logger.error(e, `Importer : RemoteImporter.xpubScan() : xpub ${xpub} ${c} ${d} ${u} ${G}`)
    } finally {
      // Push everything up the rabbit hole
      return ret
    }
  }

  /**
   * Import a list of addresses
   * @param {string[]} candidates - addresses to be imported
   * @param {boolean} filterAddr - True if addresses should be filtered, False otherwise
   */
  async importAddresses(candidates, filterAddr) {
    const t0 = Date.now()

    // Check if some addresses are currently processed
    const overlap = candidates.filter(c => this.importing[c])
    for (let a of overlap)
      Logger.info(`Importer : Import overlap for ${a}. Skipping`)

    // List addresses that need to be processed
    const addresses = candidates.filter(c => !this.importing[c])
    this.importing = addresses.reduce((m,a) => (m[a] = true, m), this.importing)

    if (addresses.length === 0) return true

    Logger.info(`Importer : Importing ${addresses.join(',')}`)

    try {
      const results = await this.sources.getAddresses(addresses, filterAddr)
      const imported = results.map(r => r.address)
      const filteredResults = results.filter(r => r.ntx > 0)
      const scanTx = [...new Set(filteredResults.map(r => r.txids).flat())]

      Logger.info(`Importer :  Got ${scanTx.length} transactions`)

      // Retrieve the transactions by batches of 100 transactions
      const txsChunks = util.splitList(scanTx, 100)
      const txs = await util.seriesCall(txsChunks, chunk => {
        return rpcTxns.getTransactions(chunk, false)
      })
      const txns = txs.flat().filter(tx => tx != null)

      // Import addresses and transactions into the database
      await db.addAddresses(imported)
      await this._importTransactions(addresses, txns)

    } catch(e) {
      Logger.error(e, `Importer : RemoteImporter.importAddresses() : ${candidates.join(',')}`)

    } finally {
      const dt = Date.now() - t0
      const ts = (dt/1000).toFixed(1)
      const N = addresses.length

      if (N > 0)
        Logger.info(`Importer : Imported ${N} addresses in ${ts}s (${(dt/N).toFixed(0)} ms/addr)`)

      for (let address of addresses)
        delete this.importing[address]

      return true
    }
  }

  /**
   * Import a list of transactions associated to a list of addresses
   * @param {object[]} addresses - array of addresses objects
   * @param {object[]} txs - array of transaction objects
   * @returns {Promise}
   */
  async _importTransactions(addresses, txs) {
    const addrChunks = util.splitList(addresses, 1000)
    const addrIdMaps = await util.parallelCall(addrChunks, chunk => {
      return db.getAddressesIds(chunk)
    })
    const addrIdMap = Object.assign({}, ...addrIdMaps)

    // Process the transactions by batches of 200 transactions
    const txsChunks = util.splitList(txs, 200)
    await util.parallelCall(txsChunks, chunk => {
      return this._addTransactions(chunk)
    })
    await util.parallelCall(txsChunks, chunk => {
      return this._addOutputs(chunk, addrIdMap)
    })
    await util.parallelCall(txsChunks, chunk => {
      return this._addInputs(chunk)
    })
  }

  /**
   * Add a collection of transactions to the database.
   * @param {object[]} txs - array of transaction objects
   * @returns {Promise}
   */
  async _addTransactions(txs) {
    try {
      // Store the transactions into the database
      await db.addTransactions(txs)

      // Confirm the transactions if needed
      const blocksHashes = txs.filter(tx => tx.block).map(tx => tx.block.hash)
      const blocks = await db.getBlocksByHashes(blocksHashes)

      return util.parallelCall(blocks, block => {
        const filteredTxs = txs.filter(tx => (tx.block && tx.block.hash === block.blockHash))
        if (filteredTxs.length === 0) return
        const txids = filteredTxs.map(tx => tx.txid)
        return db.confirmTransactions(txids, block.blockID)
      })
    } catch(e) {
      Logger.error(e, `Importer : RemoteImporter.addTransactions() :`)
    }
  }

  /**
   * Add a collection of transaction outputs to the database.
   * @param {object[]} txs - array of transaction objects
   * @params {object} addrIdMap - map address => addrId
   * @returns {Promise}
   */
  async _addOutputs(txs, addrIdMap) {
    try {
      const txids = txs.map(tx => tx.txid)
      const mapTxsIds = await db.getTransactionsIds(txids)

      const outputs = txs
        .map(tx => tx.outputs.map(o => (o.txnID = mapTxsIds[tx.txid], o)))
        .flat()
        .filter(o => addrIdMap[o.address])
        .map(o => { return {
          txnID: o.txnID,
          addrID: addrIdMap[o.address],
          outIndex: o.n,
          outAmount: o.value,
          outScript: o.scriptpubkey,
        }})

      return db.addOutputs(outputs)

    } catch(e) {
      Logger.error(e, `Importer : RemoteImporter._addOutputs() :`)
    }
  }

  /**
   * Add a collection of transaction inputs to the database.
   * @param {object[]} txs - array of transaction objects
   * @returns {Promise}
   */
  async _addInputs(txs) {
    try {
      // Retrieve the database ids for the transactions
      const txids = txs.map(tx => tx.txid)
      const mapTxsIds = await db.getTransactionsIds(txids)

      // Get any outputs spent by the inputs of this transaction,
      // add those database outIDs to the corresponding inputs, and store.
      const outpoints = txs.map(tx => tx.inputs).flat().map(input => input.outpoint)
      const res = await db.getOutputIds(outpoints)
      const spent = res.reduce((m,r) => (m[`${r.txnTxid}-${r.outIndex}`] = r.outID, m), {})

      const inputs = txs
        .map(tx => tx.inputs.map(i => (i.txnID = mapTxsIds[tx.txid], i)))
        .flat()
        .filter(i => spent[`${i.outpoint.txid}-${i.outpoint.vout}`])
        .map(i => { return {
          outID: spent[`${i.outpoint.txid}-${i.outpoint.vout}`],
          txnID: i.txnID,
          inIndex: i.n,
          inSequence: i.seq
        }})

      return db.addInputs(inputs)

    } catch(e) {
      Logger.error(e, `Importer : RemoteImporter.addTransactions() :`)
    }
  }

  /**
   * Retrieve the height of the chaintip for the remote source
   * @returns {Promise} returns an object
   *    {chainTipHeight: <chaintip_height>}
   */
  async getChainTipHeight() {
    return this.sources.getChainTipHeight()
  }

}

module.exports = new RemoteImporter()
