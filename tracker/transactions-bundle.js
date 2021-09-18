/*!
 * tracker/transactions-bundle.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const _ = require('lodash')
const LRU = require('lru-cache')
const util = require('../lib/util')
const db = require('../lib/db/mysql-db-wrapper')
const addrHelper = require('../lib/bitcoin/addresses-helper')


/**
 * A base class defining a set of transactions (mempool, block)
 */
class TransactionsBundle {

  /**
   * Constructor
   * @constructor
   * @param {object[]=} txs - array of bitcoin transaction objects
   */
  constructor(txs) {
    // List of transactions
    this.transactions = (txs == null) ? [] : txs
  }

  /**
   * Adds a transaction
   * @param {object} tx - transaction object
   */
  addTransaction(tx) {
    if (tx) {
      this.transactions.push(tx)
    }
  }

  /**
   * Clear the bundle
   */
  clear() {
    this.transactions = []
  }

  /**
   * Return the bundle as an array of transactions
   * @returns {object[]}
   */
  toArray() {
    return this.transactions.slice()
  }

  /**
   * Get the size of the bundle
   * @returns {number} return the number of transactions stored in the bundle
   */
  size() {
    return this.transactions.length
  }

  /**
   * Find the transactions of interest
   * based on theirs inputs
   * @returns {Promise<object[]>} returns an array of transactions objects
   */
  async prefilterByInputs() {
    // Process transactions by slices of 5000 transactions
    const MAX_NB_TXS = 5000
    const lists = util.splitList(this.transactions, MAX_NB_TXS)
    const results = await util.parallelCall(lists, txs => this._prefilterByInputs(txs))
    return _.flatten(results)
  }

  /**
   * Find the transactions of interest
   * based on theirs outputs
   * @returns {Promise<object[]>} returns an array of transactions objects
   */
  async prefilterByOutputs() {
    // Process transactions by slices of 5000 transactions
    const MAX_NB_TXS = 5000
    const lists = util.splitList(this.transactions, MAX_NB_TXS)
    const results = await util.parallelCall(lists, txs => this._prefilterByOutputs(txs))
    return _.flatten(results)
  }

  /**
   * Find the transactions of interest
   * based on theirs outputs (internal implementation)
   * @params {object[]} txs - array of transactions objects
   * @returns {Promise<object[]>} returns an array of transactions objects
   */
  async _prefilterByOutputs(txs) {
    let addresses = []
    let filteredIdxTxs = []
    let indexedOutputs = {}

    // Index the transaction outputs
    for (const i in txs) {
      const tx = txs[i]
      const txid = tx.getId()

      if (TransactionsBundle.cache.has(txid))
        continue

      for (const j in tx.outs) {
        try {
          const script = tx.outs[j].script
          const address = addrHelper.outputScript2Address(script)
          addresses.push(address)
          if (!indexedOutputs[address])
            indexedOutputs[address] = []
          indexedOutputs[address].push(i)
        } catch (e) {}
      }
    }

    // Prefilter
    const outRes = await db.getUngroupedHDAccountsByAddresses(addresses)
    for (const i in outRes) {
      const key = outRes[i].addrAddress
      const idxTxs = indexedOutputs[key]
      if (idxTxs) {
        for (const idxTx of idxTxs)
          if (filteredIdxTxs.indexOf(idxTx) === -1)
            filteredIdxTxs.push(idxTx)
      }
    }

    return filteredIdxTxs.map(x => txs[x])
  }

  /**
   * Find the transactions of interest
   * based on theirs inputs (internal implementation)
   * @params {object[]} txs - array of transactions objects
   * @returns {Promise<object[]>} returns an array of transactions objects
   */
  async _prefilterByInputs(txs) {
    let inputs = []
    let filteredIdxTxs = []
    let indexedInputs = {}

    for (const i in txs) {
      const tx = txs[i]
      const txid = tx.getId()

      if (TransactionsBundle.cache.has(txid))
        continue

      for (const j in tx.ins) {
        const spendHash = tx.ins[j].hash
        const spendTxid = Buffer.from(spendHash).reverse().toString('hex')
        const spendIdx = tx.ins[j].index
        inputs.push({txid: spendTxid, index: spendIdx})
        const key = spendTxid + '-' + spendIdx
        if (!indexedInputs[key])
          indexedInputs[key] = []
        indexedInputs[key].push(i)
      }
    }

    // Prefilter
    const lists = util.splitList(inputs, 1000)
    const results = await util.parallelCall(lists, list => db.getOutputSpends(list))
    const inRes = _.flatten(results)
    for (const i in inRes) {
      const key = inRes[i].txnTxid + '-' + inRes[i].outIndex
      const idxTxs = indexedInputs[key]
      if (idxTxs) {
        for (const idxTx of idxTxs)
          if (filteredIdxTxs.indexOf(idxTx) === -1)
            filteredIdxTxs.push(idxTx)
      }
    }

    return filteredIdxTxs.map(x => txs[x])
  }

}

/**
 * Cache of txids, for avoiding triple-check behavior.
 * ZMQ sends the transaction twice:
 * 1. When it enters the mempool
 * 2. When it leaves the mempool (mined or orphaned)
 * Additionally, the transaction comes in a block
 * Orphaned transactions are deleted during the routine check
 */
TransactionsBundle.cache = new LRU({
  // Maximum number of txids to store in cache
  max: 100000,
  // Function used to compute length of item
  length: (n, key) => 1,
  // Maximum age for items in the cache. Items do not expire
  maxAge: Infinity
})


module.exports = TransactionsBundle
