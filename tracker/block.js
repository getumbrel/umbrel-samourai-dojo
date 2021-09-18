/*!
 * tracker/block.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const bitcoin = require('bitcoinjs-lib')
const util = require('../lib/util')
const Logger = require('../lib/logger')
const db = require('../lib/db/mysql-db-wrapper')
const Transaction = require('./transaction')
const TransactionsBundle = require('./transactions-bundle')


/**
 * A class allowing to process a transaction
 */
class Block extends TransactionsBundle {

  /**
   * Constructor
   * @param {string} hex - block in hex format
   * @param {string} header - block header
   */
  constructor(hex, header) {
    super()
    this.hex = hex
    this.header = header

    try {
      if (hex != null) {
        const block = bitcoin.Block.fromHex(hex)
        this.transactions = block.transactions
      }
    } catch (e) {
      Logger.error(e, 'Tracker : Block()')
      Logger.error(null, header)
      return Promise.reject(e)
    }
  }

  /**
   * Register the block and transactions of interest in db
   * @dev This method isn't used anymore.
   *      It has been replaced by a parallel processing of blocks.
   *      (see blocks-processor and block-worker)
   * @returns {Promise<object[]>} returns an array of transactions to be broadcast
   */
  async processBlock() {
    Logger.info('Tracker : Beginning to process new block.')

    const t0 = Date.now()

    const txsForBroadcast = new Map()

    const txsForBroadcast1 = await this.processOutputs()
    txsForBroadcast1.map(tx => {txsForBroadcast.set(tx.getId(), tx)})

    const txsForBroadcast2 = await this.processInputs()
    txsForBroadcast2.map(tx => {txsForBroadcast.set(tx.getId(), tx)})

    const aTxsForBroadcast = [...txsForBroadcast.values()]

    const blockId = await this.registerBlock()

    await this.confirmTransactions(aTxsForBroadcast, blockId)

    // Logs and result returned
    const ntx = this.transactions.length
    const dt = ((Date.now()-t0)/1000).toFixed(1)
    const per = ((Date.now()-t0)/ntx).toFixed(0)
    Logger.info(`Tracker :  Finished block ${this.header.height}, ${dt}s, ${ntx} tx, ${per}ms/tx`)

    return aTxsForBroadcast
  }


  /**
   * Process the transaction outputs
   * @returns {Promise<object[]>} returns an array of transactions to be broadcast
   */
  async processOutputs() {
    const txsForBroadcast = new Set()
    const filteredTxs = await this.prefilterByOutputs()
    await util.parallelCall(filteredTxs, async filteredTx => {
      const tx = new Transaction(filteredTx)
      await tx.processOutputs()
      if (tx.doBroadcast)
        txsForBroadcast.add(tx.tx)
    })
    return [...txsForBroadcast]
  }

  /**
   * Process the transaction inputs
   * @returns {Promise<object[]>} returns an array of transactions to be broadcast
   */
  async processInputs() {
    const txsForBroadcast = new Set()
    const filteredTxs = await this.prefilterByInputs()
    await util.parallelCall(filteredTxs, async filteredTx => {
      const tx = new Transaction(filteredTx)
      await tx.processInputs()
      if (tx.doBroadcast)
        txsForBroadcast.add(tx.tx)
    })
    return [...txsForBroadcast]
  }

  /**
   * Store the block in db
   * @returns {Promise<number>} returns the id of the block
   */
  async registerBlock() {
    const prevBlock = await db.getBlockByHash(this.header.previousblockhash)
    const prevID = (prevBlock && prevBlock.blockID) ? prevBlock.blockID : null

    const blockId = await db.addBlock({
      blockHeight: this.header.height,
      blockHash: this.header.hash,
      blockTime: this.header.time,
      blockParent: prevID
    })

    Logger.info(`Tracker :  Added block ${this.header.height} (id=${blockId})`)

    return blockId
  }

  /**
   * Confirm the transactions in db
   * @param {Set} txs - set of transactions stored in db
   * @param {number} blockId - id of the block
   * @returns {Promise}
   */
  async confirmTransactions(txs, blockId) {
    const txids = txs.map(t => t.getId())
    const txidLists = util.splitList(txids, 100)
    return util.parallelCall(txidLists, list => db.confirmTransactions(list, blockId))
  }

  /**
   * Register the block header
   * @param {number} prevBlockID - id of previous block
   * @returns {Promise<number>}
   */
  async checkBlockHeader(prevBlockID) {
    Logger.info('Tracker : Beginning to process new block header.')

    // Insert the block header into the database
    const blockId = await db.addBlock({
      blockHeight: this.header.height,
      blockHash: this.header.hash,
      blockTime: this.header.time,
      blockParent: prevBlockID
    })

    Logger.info(`Tracker :  Added block header ${this.header.height} (id=${blockId})`)

    return blockId
  }

}

module.exports = Block
