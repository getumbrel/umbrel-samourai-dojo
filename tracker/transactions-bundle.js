/*!
 * tracker/transactions-bundle.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */


import LRU from 'lru-cache'

import util from '../lib/util.js'
import db from '../lib/db/mysql-db-wrapper.js'
import addrHelper from '../lib/bitcoin/addresses-helper.js'


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
        return [...this.transactions]
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
        return results.flat()
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
        return results.flat()
    }

    /**
     * Find the transactions of interest
     * based on theirs outputs (internal implementation)
     * @params {object[]} txs - array of transactions objects
     * @returns {Promise<object[]>} returns an array of transactions objects
     */
    async _prefilterByOutputs(txs) {
        let addresses = []
        let filteredIndexTxs = []
        let indexedOutputs = {}

        // Index the transaction outputs
        for (const index in txs) {
            const tx = txs[index]
            const txid = tx.getId()

            if (TransactionsBundle.cache.has(txid))
                continue

            for (const index_ in tx.outs) {
                try {
                    const script = tx.outs[index_].script
                    const address = addrHelper.outputScript2Address(script)
                    addresses.push(address)
                    if (!indexedOutputs[address])
                        indexedOutputs[address] = []
                    indexedOutputs[address].push(index)
                } catch {}
            }
        }

        // Prefilter
        const outRes = await db.getUngroupedHDAccountsByAddresses(addresses)
        for (const index in outRes) {
            const key = outRes[index].addrAddress
            const indexTxs = indexedOutputs[key]
            if (indexTxs) {
                for (const indexTx of indexTxs)
                    if (!filteredIndexTxs.includes(indexTx))
                        filteredIndexTxs.push(indexTx)
            }
        }

        return filteredIndexTxs.map(x => txs[x])
    }

    /**
     * Find the transactions of interest
     * based on theirs inputs (internal implementation)
     * @params {object[]} txs - array of transactions objects
     * @returns {Promise<object[]>} returns an array of transactions objects
     */
    async _prefilterByInputs(txs) {
        let inputs = []
        let filteredIndexTxs = []
        let indexedInputs = {}

        for (const index in txs) {
            const tx = txs[index]
            const txid = tx.getId()

            if (TransactionsBundle.cache.has(txid))
                continue

            for (const index_ in tx.ins) {
                const spendHash = tx.ins[index_].hash
                const spendTxid = Buffer.from(spendHash).reverse().toString('hex')
                const spendIndex = tx.ins[index_].index
                inputs.push({ txid: spendTxid, index: spendIndex })
                const key = spendTxid + '-' + spendIndex
                if (!indexedInputs[key])
                    indexedInputs[key] = []
                indexedInputs[key].push(index)
            }
        }

        // Prefilter
        const lists = util.splitList(inputs, 1000)
        const results = await util.parallelCall(lists, list => db.getOutputSpends(list))
        const inRes = results.flat()
        for (const index in inRes) {
            const key = inRes[index].txnTxid + '-' + inRes[index].outIndex
            const indexTxs = indexedInputs[key]
            if (indexTxs) {
                for (const indexTx of indexTxs)
                    if (!filteredIndexTxs.includes(indexTx))
                        filteredIndexTxs.push(indexTx)
            }
        }

        return filteredIndexTxs.map(x => txs[x])
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
    max: 100_000,
    // Function used to compute length of item
    length: () => 1,
    // Maximum age for items in the cache. Items do not expire
    maxAge: Number.POSITIVE_INFINITY
})


export default TransactionsBundle
