/*!
 * tracker/block-worker.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const { isMainThread, parentPort } = require('worker_threads')
const network = require('../lib/bitcoin/network')
const keys = require('../keys')[network.key]
const db = require('../lib/db/mysql-db-wrapper')
const { createRpcClient } = require('../lib/bitcoind-rpc/rpc-client')
const Block = require('./block')


/**
 * STATUS
 */
const IDLE = 0
module.exports.IDLE = IDLE

const INITIALIZED = 1
module.exports.INITIALIZED = INITIALIZED

const OUTPUTS_PROCESSED = 2
module.exports.OUTPUTS_PROCESSED = OUTPUTS_PROCESSED

const INPUTS_PROCESSED = 3
module.exports.INPUTS_PROCESSED = INPUTS_PROCESSED

const TXS_CONFIRMED = 4
module.exports.TXS_CONFIRMED = TXS_CONFIRMED

/**
 * OPS
 */
const OP_INIT = 0
module.exports.OP_INIT = OP_INIT

const OP_PROCESS_OUTPUTS = 1
module.exports.OP_PROCESS_OUTPUTS = OP_PROCESS_OUTPUTS

const OP_PROCESS_INPUTS = 2
module.exports.OP_PROCESS_INPUTS = OP_PROCESS_INPUTS

const OP_CONFIRM = 3
module.exports.OP_CONFIRM = OP_CONFIRM

const OP_RESET = 4
module.exports.OP_RESET = OP_RESET



/**
 * Process message received by the worker
 * @param {object} msg - message received by the worker
 */
async function processMessage(msg) {
  let res = null
  let success = true

  try {
    switch(msg.op) {
      case OP_INIT:
        if (status != IDLE)
          throw 'Operation not allowed'
        res = await initBlock(msg.header)
        break
      case OP_PROCESS_OUTPUTS:
        if (status != INITIALIZED)
          throw 'Operation not allowed'
        res = await processOutputs()
        break
      case OP_PROCESS_INPUTS:
        if (status != OUTPUTS_PROCESSED)
          throw 'Operation not allowed'
        res = await processInputs()
        break
      case OP_CONFIRM:
        if (status != INPUTS_PROCESSED)
          throw 'Operation not allowed'
        res = await confirmTransactions(msg.blockId)
        break
      case OP_RESET:
        res = await reset()
        break
      default:
        throw 'Invalid Operation'
    }
  } catch (e) {
    success = false
    res = e
  } finally {
    parentPort.postMessage({
      'op': msg.op,
      'status': success,
      'res': res
    })
  }
}

/**
 * Initialize the block
 * @param {object} header - block header
 */
async function initBlock(header) {
  status = INITIALIZED
  const hex = await rpcClient.getblock({ blockhash: header.hash, verbosity: 0 })
  block = new Block(hex, header)
  return true
}

/**
 * Process the transactions outputs
 */
async function processOutputs() {
  status = OUTPUTS_PROCESSED
  txsForBroadcast = await block.processOutputs()
  return true
}

/**
 * Process the transactions inputs
 */
async function processInputs() {
  status = INPUTS_PROCESSED
  const txs = await block.processInputs()
  txsForBroadcast = txsForBroadcast.concat(txs)
  return true
}

/**
 * Confirm the transactions
 * @param {integer} blockId - id of the block in db
 */
async function confirmTransactions(blockId) {
  status = TXS_CONFIRMED
  const aTxsForBroadcast = [...new Set(txsForBroadcast)]
  await block.confirmTransactions(aTxsForBroadcast, blockId)
  return aTxsForBroadcast
}

/**
 * Reset
 */
function reset() {
  status = IDLE
  block = null
  txsForBroadcast = []
  return true
}


/**
 * MAIN
 */
const rpcClient = createRpcClient()
let block = null
let txsForBroadcast = []
let status = IDLE

if (!isMainThread) {
  db.connect({
    connectionLimit: keys.db.connectionLimitTracker,
    acquireTimeout: keys.db.acquireTimeout,
    host: keys.db.host,
    user: keys.db.user,
    password: keys.db.pass,
    database: keys.db.database
  })

  reset()
  parentPort.on('message', processMessage)
}
